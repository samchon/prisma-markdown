import { DMMF } from "@prisma/generator-helper";
import { PrismaUtil } from "../utils/PrismaUtil";

/**
 * @pattern /[tsdnkr]/g
 */
type FormatString = string;

/**
 * supported function
 *
 * @export
 * @interface IField
 */
export interface IFieldUtil {
  format(formatString?: FormatString): string;
  data(): IFieldData;
}

/**
 * FieldUtil
 *
 * @param {DMMF.Field} field
 * @param {boolean} [isFK]
 * @return {*}  {IField}
 */
export const FieldUtil = (field: DMMF.Field, isFK?: boolean): IFieldUtil => {
  return new Field(field, isFK);
};

/**
 * process DMMF.Field
 *
 * @export
 * @interface IFieldData
 */
export interface IFieldData {
  /**
   * prisma type
   *
   * @type {string}
   * @memberof IFieldData
   */
  type: string;

  /**
   * prisma database mapping name
   *
   * @type {string}
   * @memberof IFieldData
   */
  name: string;

  /**
   * format tag
   *
   * @type {null | string}
   * @memberof IFieldData
   */
  format: null | string;

  /**
   * colunm type
   *
   * @type {null | string}
   * @memberof IFieldData
   */
  nativeType: null | string;

  /**
   * column size
   *
   * @type {null | number}
   * @memberof IFieldData
   */
  size: null | number;

  /**
   * "PK" | "UK" | "FK" expressed null, singly or mixed
   *
   * @type {null | string}
   * @memberof IFieldData
   */
  constraint: null | string;

  /**
   * not null
   *
   * @type {boolean}
   * @memberof IFieldData
   */
  nullable: boolean;
}

/**
 * DMMF Field Paser
 *
 * @class Field
 */
class Field implements IFieldUtil {
  constructor(
    private readonly field: DMMF.Field,
    private readonly isFK?: boolean,
  ) {}

  /**
   * t: type
   * s: size
   * d: native type
   * n: name
   * k: constant
   * r: nullable
   *
   * @param {string} [formatString]
   * @memberof Field
   */
  format(formatString?: FormatString): string {
    if (!formatString) return this.field.type;

    const data = this.data();

    return formatString.replace(/[tsdnkr]/g, (match) => {
      switch (match) {
        case "t": // type
          return this.field.type;
        case "s": // size
          return `${data.size ?? ""}`;
        case "d": // databaseType
          return data.nativeType || this.field.type;
        case "n": // name
          return data.name;
        case "k": // PK, FK, UK
          return `${data.constraint ?? ""}`;
        case "r":
          return data.nullable ? `"nullable"` : "";
        default:
          return "";
      }
    });
  }

  data(): IFieldData {
    const spec: IFieldData = {
      type: "",
      name: "",
      format: null,
      nativeType: null,
      size: null,
      constraint: null,
      nullable: false,
    };

    spec.type = this.field.type;

    if (PrismaUtil.tagValues("format")(this.field).length > 0) {
      spec["format"] = PrismaUtil.tagValues("format")(this.field)[0];
    }

    spec["nativeType"] = this.field.nativeType?.[0] ?? null;

    spec["size"] = this.field.nativeType?.[1]?.[0]
      ? parseInt(this.field.nativeType?.[1]?.[0] ?? "0")
      : null;

    const keys = [];
    if (this.field.isId) keys.push("PK");
    if (this.isFK) keys.push("FK");
    if (this.field.isUnique) keys.push("UK");
    spec["constraint"] = keys.join(",");

    spec["nullable"] = !this.field.isRequired;
    spec["name"] = this.field.dbName ?? this.field.name;

    return spec;
  }
}
