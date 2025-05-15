#!/usr/bin/env node
import fs from "fs";
import path from "path";

import { generatorHandler } from "@prisma/generator-helper";
import { MarkdownWriter } from "../writers/MarkdownWriter";
import { format as formatMarkdown } from "prettier";

const { version } = require("../../package.json");

generatorHandler({
  onManifest: () => ({
    version,
    defaultOutput: "./ERD.md",
    prettyName: "prisma-markdown",
  }),

  onGenerate: async (options) => {
    const rawContent: string = MarkdownWriter.write(
      options.dmmf.datamodel,
      options.generator.config,
    );

    // Lint/format le Markdown avec Prettier
    const content = await formatMarkdown(rawContent, {
      parser: "markdown",
    });

    const file: string = options.generator.output?.value ?? "./ERD.md";

    try {
      await fs.promises.mkdir(path.dirname(file), { recursive: true });
    } catch {}

    await fs.promises.writeFile(file, content, "utf8");
  },
});
