import { DMMF } from "@prisma/generator-helper";

export interface ITagSection {
    name: string;
    models: DMMF.Model[];
    erdOnly: DMMF.Model[];
}
