# Prisma Markdown
## Outline
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/prisma-markdown/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/prisma-markdown.svg)](https://www.npmjs.com/package/prisma-markdown)
[![Downloads](https://img.shields.io/npm/dm/prisma-markdown.svg)](https://www.npmjs.com/package/prisma-markdown)
[![Build Status](https://github.com/samchon/prisma-markdown/workflows/build/badge.svg)](https://github.com/samchon/prisma-markdown/actions?query=workflow%3Abuild)
[![Example](https://img.shields.io/badge/example-forestgreen)](https://github.com/samchon/prisma-markdown/blob/master/ERD.md)

Prisma markdown documents generator.

  - Mermaid ERD diagrams
  - Descriptions written by `///` comments
  - Separations by `@tag` comments




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




## Demonstration
You can see how markdown document being generated: 

- Prisma schema file: [schema.prisma](https://github.com/samchon/prisma-markdown/blob/master/schema.prisma)
- Generated markdown: [ERD.md](https://github.com/samchon/prisma-markdown/blob/master/ERD.md)