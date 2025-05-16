import { DMMF } from "@prisma/generator-helper";
import { describe, expect, it } from "vitest";
import { FieldUtil } from "./FieldUtil";

describe("FieldUtil", () => {
  it("format", () => {
    const input: DMMF.Field = {
      name: "isVarcharNone",
      dbName: "varchar_size_none",
      kind: "scalar",
      isList: false,
      isRequired: false,
      isUnique: false,
      isId: true,
      isReadOnly: false,
      hasDefaultValue: false,
      type: "String",
      nativeType: ["VarChar", []],
      isGenerated: false,
      isUpdatedAt: false,
      documentation: "string test varchar test size none",
    };

    expect(FieldUtil(input).format("t")).toBe("String"); // type
    expect(FieldUtil(input).format("s")).toBe(""); // size
    expect(
      FieldUtil({
        ...input,
        nativeType: ["VarChar", ["127"]],
      }).format("s"),
    ).toBe("127"); // size
    expect(FieldUtil(input).format("d")).toBe("VarChar"); // column type
    expect(FieldUtil(input).format("n")).toBe("varchar_size_none"); // column n
    expect(FieldUtil(input).format("k")).toBe("PK"); // key

    expect(FieldUtil({ ...input, isUnique: true }).format("k")).toBe("PK,UK"); // key
    expect(FieldUtil({ ...input, isUnique: true }, true).format("k")).toBe(
      "PK,FK,UK",
    ); // key

    expect(FieldUtil({ ...input }, true).format("k")).toBe("PK,FK"); // key

    expect(FieldUtil(input).format("r")).toBe('"nullable"'); // nullable
    expect(FieldUtil({ ...input, isRequired: true }).format("r")).toBe(""); // nullable
  });

  it("data", () => {
    const input: DMMF.Field = {
      name: "isVarcharNone",
      dbName: "varchar_size_none",
      kind: "scalar",
      isList: false,
      isRequired: false,
      isUnique: false,
      isId: true,
      isReadOnly: false,
      hasDefaultValue: false,
      type: "String",
      nativeType: ["VarChar", ["255"]],
      isGenerated: false,
      isUpdatedAt: false,
      documentation: "string test varchar test size none",
    };

    expect(FieldUtil(input).data()).toStrictEqual({
      name: "varchar_size_none",
      constraint: "PK",
      format: null,
      nativeType: "VarChar",
      nullable: true,
      size: 255,
      type: "String",
    });
  });
});
