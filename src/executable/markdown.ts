#!/usr/bin/env node
import fs from "fs";
import path from "path";

import { generatorHandler } from "@prisma/generator-helper";
import { MarkdownWriter } from "../writers/MarkdownWriter";

const { version } = require("../../package.json");

generatorHandler({
  onManifest: () => ({
    version,
    defaultOutput: "./ERD.md",
    prettyName: "prisma-markdown",
  }),
  onGenerate: async (options) => {
    const content: string = MarkdownWriter.write(
      options.dmmf.datamodel,
      options.generator.config,
    );
    const file: string = options.generator.output?.value ?? "./ERD.md";
    try {
      await fs.promises.mkdir(path.dirname(file), { recursive: true });
    } catch {}
    await fs.writeFileSync(file, content, "utf8");
  },
});
