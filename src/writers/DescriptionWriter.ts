import { DMMF } from "@prisma/client/runtime/library";
import { PrismaUtil } from "../utils/PrismaUtil";

export namespace DescriptionWriter {
  export const table = (model: DMMF.Model): string => {
    const description: string = writeDescription(model);
    return [
      `### \`${model.dbName ?? model.name}\``,
      ...(description.length ? [description] : []),
      "",
      "**Properties**",
      ...model.fields.filter((f) => f.kind !== "object").map(writeField),
    ].join("\n");
  };

  const writeField = (field: DMMF.Field): string => {
    const description: string = writeDescription(field);
    const lines: string[] = description.split("\n");
    const head = `  - \`${field.dbName ?? field.name}\``;

    if (lines.length === 0) return head;
    else if (lines.length === 1) return `${head}: ${lines[0]}`;
    return [head, ...lines.map((line) => `    > ${line}`)].join("\n");
  };

  const writeDescription = (target: DMMF.Model | DMMF.Field): string => {
    const content: string[] = (target.documentation ?? "")
      .split("\r\n")
      .join("\n")
      .split("\n");
    let first: number = 0;
    let last: number = content.length - 1;

    const empty = (str: string) => str.trim() === "" || str.trim()[0] === "@";

    while (first < content.length && empty(content[first])) ++first;
    while (last >= 0 && empty(content[last])) --last;

    const summary: string[] = PrismaUtil.tagValues("summary")(target);
    const body: string[] = content.slice(first, last + 1).map(replaceLinks);

    return summary.length
      ? body.length
        ? [summary[0], "", ...body].join("\n")
        : summary[0]
      : body.join("\n");
  };

  const replaceLinks = (content: string): string => {
    const rejoined: string[] = [];
    let i: number = 0;

    while (true) {
      const first: number = content.indexOf("{@link ", i);
      if (first === -1) break;

      const last: number = content.indexOf("}", first + 7);
      if (last === -1) break;

      const part: string = content.slice(first + 7, last).trim();
      const space: number = part.indexOf(" ");
      rejoined.push(content.slice(i, first));

      if (space === -1) rejoined.push(`[${part}](#${part.split(".")[0]})`);
      else
        rejoined.push(
          `[${part.slice(space + 1)}](#${part.slice(0, space).split(".")[0]})`,
        );
      i = last + 1;
    }
    rejoined.push(content.slice(i));
    return rejoined.join("");
  };
}
