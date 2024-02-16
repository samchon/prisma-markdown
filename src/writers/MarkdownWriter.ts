import { DMMF } from "@prisma/generator-helper";
import { MermaidWriter } from "./MermaidWriter";
import { DescriptionWriter } from "./DescriptionWriter";
import { MapUtil } from "../utils/MapUtil";
import { PrismaUtil } from "../utils/PrismaUtil";

export namespace MarkdownWriter {
  export const write = (
    schema: DMMF.Datamodel,
    config?: Record<string, string | string[] | undefined>,
  ): string => {
    // LIST UP MODELS
    const dict: Map<string, IChapter> = new Map();
    const modelList: DMMF.Model[] = schema.models.filter(
      (model) => !isHidden(model),
    );
    findImplicits(modelList);

    const emplace = (name: string) =>
      MapUtil.take(dict)(name, () => ({
        name,
        descriptions: new Set(),
        diagrams: new Set(),
      }));

    // TOP NAMESPACE
    for (const model of modelList) {
      const namespaces: string[] = takeTags("namespace")(model);
      if (namespaces.length === 0) continue;

      const top: string = namespaces[0];
      const chapter: IChapter = emplace(top);
      chapter.descriptions.add(model);
      chapter.diagrams.add(model);
    }

    // REMAINING NAMESPACES
    for (const model of modelList) {
      const namespaces: string[] = takeTags("namespace")(model);
      for (const name of namespaces.slice(1)) {
        const section = emplace(name);
        section.descriptions.add(model);
        section.diagrams.add(model);
      }
    }

    // DESCRIPTIONS
    for (const model of modelList) {
      const describes: string[] = takeTags("describe")(model);
      for (const name of describes) {
        const chapter: IChapter = MapUtil.take(dict)(name, () => ({
          name,
          descriptions: new Set(),
          diagrams: new Set(),
        }));
        chapter.descriptions.add(model);
      }
    }

    // ERD ONLY
    for (const model of modelList) {
      const erdList: string[] = takeTags("erd")(model);
      for (const erd of erdList) {
        const chapter: IChapter = MapUtil.take(dict)(erd, () => ({
          name: erd,
          descriptions: new Set(),
          diagrams: new Set(),
        }));
        chapter.diagrams.add(model);
      }
    }

    // DEFAULTS
    for (const model of modelList) {
      const keywords: string[] = [
        ...takeTags("namespace")(model),
        ...takeTags("describe")(model),
        ...takeTags("erd")(model),
      ];
      if (keywords.length !== 0) continue;

      const basic: IChapter = MapUtil.take(dict)("default", () => ({
        name: "default",
        descriptions: new Set(),
        diagrams: new Set(),
      }));
      basic.descriptions.add(model);
      basic.diagrams.add(model);
    }

    // DO WRITE
    const title: string =
      typeof config?.title === "string" ? config.title : "Prisma Markdown";
    const preface: string = [
      `# ${title}`,
      "> Generated by [`prisma-markdown`](https://github.com/samchon/prisma-markdown)",
      "",
      ...[...dict.keys()].map((name) => `- [${name}](#${name.toLowerCase()})`),
    ].join("\n");
    return (
      preface +
      "\n\n" +
      [...dict.values()]
        .filter((s) => !!s.descriptions.size)
        .map(writeChapter)
        .join("\n\n\n")
    );
  };

  const takeTags =
    (kind: "namespace" | "describe" | "erd") =>
    (model: DMMF.Model): string[] => [
      ...new Set(
        PrismaUtil.tagValues(kind)(model).map((str) => str.split(" ")[0]),
      ),
    ];

  const isHidden = (model: DMMF.Model): boolean =>
    model.documentation?.includes("@hidden") ?? false;

  const writeChapter = (chapter: IChapter): string =>
    [
      `## ${chapter.name}`,
      MermaidWriter.write([...chapter.diagrams]),
      "",
      [...chapter.descriptions].map(DescriptionWriter.table).join("\n\n"),
    ].join("\n");

  const findImplicits = (modelList: DMMF.Model[]) => {
    const dict: Map<string, DMMF.Model> = new Map();
    for (const model of modelList)
      for (const field of model.fields) {
        if (
          field.kind !== "object" ||
          field.isList !== true ||
          field.isUnique !== false
        )
          continue;

        const opposite: DMMF.Model | undefined = modelList.find(
          (model) => model.name === field.type,
        );
        const oppositeField = opposite?.fields.find(
          (field) =>
            field.kind === "object" &&
            field.isList &&
            field.type === model.name,
        );
        if (
          opposite === undefined ||
          oppositeField === undefined ||
          model === opposite
        )
          continue;

        const relations: DMMF.Model[] = [model, opposite].sort((x, y) =>
          x.name.localeCompare(y.name),
        );
        const table: string = `_${relations[0].name}To${relations[1].name}`;
        if (dict.has(table)) continue;

        const newbie: DMMF.Model = implicitToExplicit(relations[0])(
          relations[1],
        );
        modelList.push(newbie);
        dict.set(table, newbie);
      }
  };

  const implicitToExplicit =
    (x: DMMF.Model) =>
    (y: DMMF.Model): DMMF.Model => {
      const name: string = `_${x.name}To${y.name}`;
      const tagger = (kind: "namespace" | "describe" | "erd"): string[] =>
        [...new Set([...takeTags(kind)(x), ...takeTags(kind)(y)])].map(
          (value) => `@${kind} ${value}`,
        );
      const description: string[] = [
        `Pair relationship table between {@link ${
          x.dbName ?? x.name
        }} and {@link ${y.dbName ?? y.name}}`,
        "",
        ...tagger("describe"),
        ...tagger("erd"),
        ...tagger("namespace"),
      ];
      if (description.length === 2) description.splice(1, 1);

      const newbie: DMMF.Model = {
        name,
        dbName: null,
        fields: [
          {
            kind: "scalar",
            name: "A",
            type: x.primaryKey?.fields[0] ?? "String",
            isRequired: true,
            isList: false,
            isUnique: false,
            isId: false,
            isReadOnly: false,
            hasDefaultValue: false,
          },
          {
            kind: "scalar",
            name: "B",
            type: y.primaryKey?.fields[0] ?? "String",
            isRequired: true,
            isList: false,
            isUnique: false,
            isId: false,
            isReadOnly: false,
            hasDefaultValue: false,
          },
          {
            kind: "object",
            name: x.name,
            type: x.name,
            isRequired: true,
            isList: false,
            isUnique: false,
            isId: false,
            isReadOnly: false,
            hasDefaultValue: false,
            relationToFields: [x.primaryKey?.fields[0] ?? "id"],
            relationFromFields: ["A"],
          },
          {
            kind: "object",
            name: y.name,
            type: y.name,
            isRequired: true,
            isList: false,
            isUnique: false,
            isId: false,
            isReadOnly: false,
            hasDefaultValue: false,
            relationToFields: [y.primaryKey?.fields[0] ?? "id"],
            relationFromFields: ["B"],
          },
        ],
        uniqueFields: [["A", "B"]],
        uniqueIndexes: [],
        primaryKey: null,
        documentation: description.join("\n"),
      };
      (x.fields as DMMF.Field[]).push({
        kind: "object",
        name,
        type: name,
        isRequired: true,
        isList: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        hasDefaultValue: false,
        relationToFields: ["A"],
      });
      (y.fields as DMMF.Field[]).push({
        kind: "object",
        name,
        type: name,
        isRequired: true,
        isList: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        hasDefaultValue: false,
        relationToFields: ["B"],
      });
      return newbie;
    };
}

interface IChapter {
  name: string;
  descriptions: Set<DMMF.Model>;
  diagrams: Set<DMMF.Model>;
}
