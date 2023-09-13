import { DMMF } from "@prisma/client/runtime/library";

export namespace DescriptionWriter {
    export const table = (model: DMMF.Model): string => {
        const description: string = writeDescription(model.documentation ?? "");
        return [
            `### ${model.dbName ?? model.name}`,
            ...(description.length ? [description] : []),
            "",
            "  - Properties",
            ...model.fields.filter((f) => f.kind !== "object").map(writeField),
        ].join("\n");
    };

    const writeField = (field: DMMF.Field): string => {
        const description: string = writeDescription(field.documentation ?? "");
        const lines: string[] = description
            .split("\n")
            .filter((str) => !!str.length);
        if (lines.length === 0)
            return `    - \`${field.dbName ?? field.name}\``;
        else if (lines.length === 1)
            return `    - \`${field.dbName ?? field.name}\`: ${lines[0]}`;
        else
            return [
                `    - \`${field.dbName ?? field.name}\``,
                ...lines.map((line) => `      - ${line}`),
            ].join("\n");
    };

    const writeDescription = (documentation: string | null): string => {
        const content: string[] = (documentation ?? "")
            .split("\r\n")
            .join("\n")
            .split("\n");
        let first: number = 0;
        let last: number = content.length - 1;

        const empty = (str: string) =>
            str.trim() === "" || str.trim()[0] === "@";

        while (first < content.length && empty(content[first])) ++first;
        while (last >= 0 && empty(content[last])) --last;

        return content
            .slice(first, last + 1)
            .map(replaceLinks)
            .join("\n");
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

            if (space === -1)
                rejoined.push(`[${part}](#${part.split(".")[0]})`);
            else
                rejoined.push(
                    `[${part.slice(space + 1)}](#${
                        part.slice(0, space).split(".")[0]
                    })`,
                );
            i = last + 1;
        }
        rejoined.push(content.slice(i));
        return rejoined.join("");
    };
}
