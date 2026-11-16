import { DMMF } from "@prisma/generator-helper";
import { MarkdownUtil } from "./MarkdownUtil";

export namespace PrismaMarkdownLinker {
  export const create = (
    models: readonly DMMF.Model[],
    bookmarks: ReadonlyMap<DMMF.Model, string> = new Map(),
  ): ((reference: string) => string) => {
    const names = new Map(models.map((model) => [model.name, model]));
    const dbNames = new Map(
      models
        .filter((model) => model.dbName !== null)
        .map((model) => [model.dbName, model]),
    );

    return (reference) => {
      const name: string = reference.split(".")[0];
      // Prisma model names take precedence over legacy database-name links.
      const model: DMMF.Model | undefined = names.get(name);
      if (model !== undefined)
        return (
          bookmarks.get(model) ??
          MarkdownUtil.bookmark(model.dbName ?? model.name)
        );

      // A mapped table name can itself contain dots.
      let alias: string = reference;
      while (true) {
        const target: DMMF.Model | undefined = dbNames.get(alias);
        if (target !== undefined)
          return (
            bookmarks.get(target) ??
            MarkdownUtil.bookmark(target.dbName ?? target.name)
          );
        const dot: number = alias.lastIndexOf(".");
        if (dot === -1) break;
        alias = alias.slice(0, dot);
      }
      return MarkdownUtil.bookmark(name);
    };
  };
}
