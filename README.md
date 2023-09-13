# Prisma Markdown
## Outline
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/prisma-markdown/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/prisma-markdown.svg)](https://www.npmjs.com/package/prisma-markdown)
[![Downloads](https://img.shields.io/npm/dm/prisma-markdown.svg)](https://www.npmjs.com/package/prisma-markdown)
[![Build Status](https://github.com/samchon/prisma-markdown/workflows/build/badge.svg)](https://github.com/samchon/prisma-markdown/actions?query=workflow%3Abuild)
[![Example](https://img.shields.io/badge/guide-example-forestgreen)](https://github.com/samchon/prisma-markdown/blob/master/ERD.md)

Prisma markdown documents generator.

  - Mermaid ERD diagrams
  - Descriptions written by `///` comments
  - Separations by `@tag` comments

If you want to see how markdown document being generated, read below examples:

  - Generated markdown: [samchon/prisma-markdown/ERD.md](https://github.com/samchon/prisma-markdown/blob/master/ERD.md)
  - Prisma schema file: [samchon/prisma-markdown/schema.prisma](https://github.com/samchon/prisma-markdown/blob/master/schema.prisma)



## Setup
At first, install NPM package.

```bash
npm i -D prisma-markdown
```

At next, add the generator to the schema file.

```prisma
generator markdown {
  provider = "prisma-markdown"
  output   = "./ERD.md"
}
```

At last, run below command, than [ERD.md](https://github.com/samchon/prisma-markdown/blob/master/ERD.md) file would be generated.

```bash
npx prisma generate
```




## `@tag` and `@erdTag`
If your database has over hundreds of models, none of automatic ERD generators can express them perfect. In that case, `prisma-migration` recommends you to separate hundreds of models to multiple paginated diagrams by using `/// @tags <name>` comments.

When you write `/// @tags <name>` comment on models, they would be separated to proper sections of markdown document. For reference, you can assign multiple `@tag`s to a model, and if you do not assign any `@tag` to a model, it would be assigned to `default` tag.

Also, if you use `@erdTag` instead of `@tag`, target model would be expressed only at ERD. It would not be appeared to the markdown content section.

```prisma
/// @tag Actors
/// @erdTag Articles
/// @erdTag Orders
/// @erdTag Deposits
model shopping_customers {}

/// @tag Articles
model shopping_questions {}

/// @tag Orders
model shopping_orders {}

/// @tag Deposits
model shopping_deposits {}
```