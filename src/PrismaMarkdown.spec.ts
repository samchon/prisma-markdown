import { DMMF } from "@prisma/generator-helper";
import { describe, expect, it } from "vitest";
import { PrismaMarkdown } from "./PrismaMarkdown";

const field = (props: Partial<DMMF.Field> = {}): DMMF.Field => ({
  name: "id",
  kind: "scalar",
  type: "String",
  isRequired: true,
  isList: false,
  isUnique: false,
  isId: true,
  isReadOnly: false,
  hasDefaultValue: false,
  ...props,
});

const model = (name: string, props: Partial<DMMF.Model> = {}): DMMF.Model => ({
  name,
  dbName: null,
  schema: null,
  fields: [field()],
  uniqueFields: [],
  uniqueIndexes: [],
  primaryKey: null,
  ...props,
});

const write = (models: DMMF.Model[]): string =>
  PrismaMarkdown.write({ models, enums: [], types: [], indexes: [] });

describe("Markdown cross references", () => {
  it("resolves every reference from issue #45 to its rendered table heading", () => {
    const content = write([
      model("User", {
        dbName: "users",
        documentation:
          "Owns many {@link Post posts}; see also {@link UserProfile}.",
      }),
      model("UserProfile", {
        dbName: "user_profiles",
        documentation: "Profile of {@link User}.",
      }),
      model("Post", {
        fields: [
          field(),
          field({
            name: "authorId",
            isId: false,
            documentation: "Author {@link User.id}.",
          }),
        ],
      }),
    ]);

    expect(content).toContain("### `users`");
    expect(content).toContain("### `user_profiles`");
    expect(content).toContain("### `Post`");
    expect(content).toContain(
      "Owns many [posts](#post); see also [UserProfile](#user_profiles).",
    );
    expect(content).toContain("Profile of [User](#users).");
    expect(content).toContain("- `authorId`: Author [User.id](#users).");
  });

  it.each([
    ["User", "User"],
    ["User.id", "User.id"],
    ["User member", "member"],
    ["User.id member identifier", "member identifier"],
    ["users", "users"],
    ["users.id", "users.id"],
    ["users members", "members"],
    ["User\tmember", "member"],
    ["User   member", "member"],
  ])("preserves the label in {@link %s}", (reference, label) => {
    const content = write([
      model("User", {
        dbName: "users",
        documentation: `See {@link ${reference}}.`,
      }),
    ]);
    expect(content).toContain(`See [${label}](#users).`);
  });

  it("handles mapped lowercase names independently of case conversion", () => {
    expect(
      write([
        model("user", {
          dbName: "members",
          documentation: "See {@link user}.",
        }),
      ]),
    ).toContain("See [user](#members).");
  });

  it("normalizes unmapped PascalCase names", () => {
    expect(
      write([
        model("UserProfile", {
          documentation: "See {@link UserProfile}.",
        }),
      ]),
    ).toContain("See [UserProfile](#userprofile).");
  });

  it("resolves targets in other chapters from the complete schema", () => {
    const content = write([
      model("User", {
        dbName: "users",
        documentation: "See {@link UserProfile}.\n\n@namespace Accounts",
      }),
      model("UserProfile", {
        dbName: "user_profiles",
        documentation: "See {@link User}.\n\n@namespace Profiles",
      }),
    ]);
    expect(content).toContain("## Accounts");
    expect(content).toContain("## Profiles");
    expect(content).toContain("See [UserProfile](#user_profiles).");
    expect(content).toContain("See [User](#users).");
  });

  it.each([false, true])(
    "converts links in model and field summaries (body: %s)",
    (withBody) => {
      const documentation = [
        ...(withBody ? ["Body {@link User.id}.", ""] : []),
        "@summary Summary {@link User users}.",
      ].join("\r\n");
      const content = write([
        model("User", {
          dbName: "users",
          documentation,
          fields: [field({ documentation })],
        }),
      ]);
      expect(content.match(/Summary \[users\]\(#users\)\./g)).toHaveLength(2);
      if (withBody)
        expect(content.match(/Body \[User.id\]\(#users\)\./g)).toHaveLength(2);
      expect(content).not.toContain("{@link");
    },
  );

  it("keeps unknown and malformed references usable without a schema target", () => {
    const content = write([
      model("User", {
        documentation: "See {@link Missing.id unknown}; incomplete {@link User",
      }),
    ]);
    expect(content).toContain(
      "See [unknown](#missing); incomplete {@link User",
    );
  });

  it("prefers Prisma names over conflicting legacy database-name aliases", () => {
    const content = write([
      model("User", {
        dbName: "members",
        documentation: "See {@link User} and {@link Profile}.",
      }),
      model("Profile", { dbName: "User" }),
    ]);
    expect(content).toContain("See [User](#members) and [Profile](#user).");
  });

  it("normalizes mapped headings with punctuation, spaces, and Unicode", () => {
    const content = write([
      model("User", {
        dbName: "사용자 Profiles.v2",
        documentation: "See {@link User.id}.",
      }),
      model("Audit", {
        dbName: "Audit.Log",
        documentation: "See {@link Audit.Log} and {@link Audit.Log.id}.",
      }),
    ]);
    expect(content).toContain("See [User.id](#사용자-profilesv2).");
    expect(content).toContain(
      "See [Audit.Log](#auditlog) and [Audit.Log.id](#auditlog).",
    );
  });

  it("supports legacy dotted database names without a matching Prisma prefix", () => {
    expect(
      write([
        model("AuditEntry", {
          dbName: "Audit.Log",
          documentation: "See {@link Audit.Log} and {@link Audit.Log.id}.",
        }),
      ]),
    ).toContain("See [Audit.Log](#auditlog) and [Audit.Log.id](#auditlog).");
  });

  it.each([false, true])(
    "resolves implicit M:N descriptions and links to their generated table (mapped: %s)",
    (mapped) => {
      const content = write([
        model("Author", {
          dbName: mapped ? "Book" : null,
          documentation: "See {@link _AuthorToBook}.",
          fields: [
            field(),
            field({
              name: "books",
              kind: "object",
              type: "Book",
              isList: true,
            }),
          ],
        }),
        model("Book", {
          dbName: mapped ? "Books" : null,
          fields: [
            field(),
            field({
              name: "authors",
              kind: "object",
              type: "Author",
              isList: true,
            }),
          ],
        }),
      ]);
      expect(content).toContain("### `_AuthorToBook`");
      expect(content).toContain("See [_AuthorToBook](#_authortobook).");
      expect(content).toContain(
        mapped
          ? "Pair relationship table between [Book](#book) and [Books](#books)"
          : "Pair relationship table between [Author](#author) and [Book](#book)",
      );
    },
  );

  it("keeps standalone APIs and their use as map callbacks compatible", () => {
    const user = model("User", {
      dbName: "users",
      documentation: "See {@link User.id} and {@link UserProfile}.",
    });
    const profile = model("UserProfile", { dbName: "user_profiles" });
    expect(PrismaMarkdown.writeDescription(user)).toContain(
      "See [User.id](#users) and [UserProfile](#userprofile).",
    );
    expect([user].map(PrismaMarkdown.writeDescription)[0]).toBe(
      PrismaMarkdown.writeDescription(user),
    );
    const chapter = {
      name: "Accounts",
      descriptions: [user, profile],
      diagrams: [],
    };
    expect(PrismaMarkdown.writeChapter(chapter)).toContain(
      "See [User.id](#users) and [UserProfile](#user_profiles).",
    );
    expect([chapter].map(PrismaMarkdown.writeChapter)[0]).toBe(
      PrismaMarkdown.writeChapter(chapter),
    );
  });

  it("accounts for collisions between chapter and model headings", () => {
    const user = model("User", {
      documentation: "See {@link User}.\n\n@namespace User",
    });
    expect(write([user])).toContain("See [User](#user-1).");
    expect(
      PrismaMarkdown.writeChapter({
        name: "User",
        descriptions: [user],
        diagrams: [],
      }),
    ).toContain("See [User](#user-1).");
  });

  it("accounts for model headings that normalize to the same anchor", () => {
    const content = write([
      model("User", {
        dbName: "Profiles",
        documentation: "See {@link Customer}.",
      }),
      model("Customer", { dbName: "profiles" }),
    ]);
    expect(content).toContain("See [Customer](#profiles-1).");
  });

  it("reserves the document title's anchor before model headings", () => {
    expect(
      PrismaMarkdown.write(
        {
          models: [
            model("User", {
              dbName: "users",
              documentation: "See {@link User}.",
            }),
          ],
          enums: [],
          types: [],
          indexes: [],
        },
        { title: "users" },
      ),
    ).toContain("See [User](#users-1).");
  });

  it("resolves references to the first occurrence of a repeated model", () => {
    const content = write([
      model("User", {
        documentation:
          "See {@link User}.\n\n@namespace Accounts\n@namespace Profiles",
      }),
    ]);
    expect(content.match(/### `User`/g)).toHaveLength(2);
    expect(content.match(/See \[User\]\(#user\)\./g)).toHaveLength(2);
  });

  it("reserves colliding chapter bookmarks in document order", () => {
    const content = write([
      model("User", { documentation: "@namespace Accounts.v2" }),
      model("Profile", { documentation: "@namespace Accountsv2" }),
    ]);
    expect(content).toContain("- [Accounts.v2](#accountsv2)");
    expect(content).toContain("- [Accountsv2](#accountsv2-1)");
  });

  it("avoids collisions with existing numeric suffixes", () => {
    const content = write([
      model("First", {
        dbName: "Users",
        documentation: "See {@link Second}, {@link Third}, {@link Fourth}.",
      }),
      model("Second", { dbName: "users" }),
      model("Third", { dbName: "users-1" }),
      model("Fourth", { dbName: "USERS" }),
    ]);
    expect(content).toContain(
      "See [Second](#users-1), [Third](#users-1-1), [Fourth](#users-2).",
    );
  });

  it("uses the same normalization for chapter bookmarks", () => {
    expect(
      write([model("User", { documentation: "@namespace Accounts.v2" })]),
    ).toContain("- [Accounts.v2](#accountsv2)");
  });
});
