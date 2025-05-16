import { DMMF } from "@prisma/generator-helper";

export interface IPrismaMarkdownChapter {
  name: string;
  descriptions: DMMF.Model[];
  diagrams: DMMF.Model[];
}
