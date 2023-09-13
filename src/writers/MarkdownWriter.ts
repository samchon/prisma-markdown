import { DMMF } from "@prisma/generator-helper";
import { MermaidWriter } from "./MermaidWriter";
import { DescriptionWriter } from "./DescriptionWriter";
import { MapUtil } from "../utils/MapUtil";

export namespace MarkdownWriter {
    export const write = (schema: DMMF.Datamodel): string => {
        const dict: Map<string, DMMF.Model[]> = new Map();
        for (const model of schema.models) {
            const names: string[] = getGroups(model);
            if (names.length === 0)
                MapUtil.take(dict)("default", () => []).push(model);
            else
                for (const n of names)
                    MapUtil.take(dict)(n, () => []).push(model);
        }
        return [...dict]
            .map(([name, models]) => writeGroup(name, models))
            .join("\n\n\n");
    };

    const getGroups = (model: DMMF.Model): string[] => {
        if (!model.documentation?.length) return [];

        const names: Set<string> = new Set();
        const splitted: string[] = model.documentation
            .split("\r\n")
            .join("\n")
            .split("\n");
        for (const line of splitted) {
            const first: number = line.indexOf("@group ");
            if (first === -1) continue;

            const last: number = line.indexOf(" ", first + 7);
            names.add(
                last === -1
                    ? line.slice(first + 7)
                    : line.slice(first + 7, last),
            );
        }
        return [...names];
    };

    const writeGroup = (name: string, models: DMMF.Model[]): string =>
        [
            `## ${name}`,
            MermaidWriter.write(models),
            "",
            models.map(DescriptionWriter.table).join("\n\n"),
        ].join("\n");
}
