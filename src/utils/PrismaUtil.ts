import { DMMF } from "@prisma/generator-helper";

export namespace PrismaUtil {
    export const tagValues =
        (kind: string) =>
        (model: DMMF.Model | DMMF.Field): string[] => {
            if (!model.documentation?.length) return [];

            const output: string[] = [];
            const splitted: string[] = model.documentation
                .split("\r\n")
                .join("\n")
                .split("\n");
            for (const line of splitted) {
                const first: number = line.indexOf(`@${kind} `);
                if (first === -1) continue;

                output.push(line.slice(first + kind.length + 2).trim());
            }
            return output
                .map((str) => str.trim())
                .filter((str) => !!str.length);
        };
}
