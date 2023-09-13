#!/usr/bin/env node
import fs from "fs";

import { generatorHandler } from "@prisma/generator-helper";
import { MarkdownWriter } from "../writers/MarkdownWriter";

const { version } = require("../../package.json");

generatorHandler({
    onManifest: () => ({
        version,
        defaultOutput: "../generated",
        prettyName: "prisma-markdown",
    }),
    onGenerate: async (options) => {
        const content: string = MarkdownWriter.write(options.dmmf.datamodel);
        await fs.writeFileSync(
            options.generator.output?.value ?? "ERD.md",
            content,
            "utf8",
        );
    },
});
