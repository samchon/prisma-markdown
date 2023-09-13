# Prisma Markdown
## Outline
Prisma markdown documents generator.

  - Mermaid ERD diagrams
  - Descriptions written by `///` comments




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

At last, run below command, than [ERD.md](https://github.com/samchon/prisma-markdown/ERD.md) file would be generated.

```bash
npx prisma generate
```




## Demonstration
You can see how markdown document being generated: 

- Prisma schema file: [schema.prisma](https://github.com/samchon/prisma-markdown/schema.prisma)
- Generated markdown: [ERD.md](https://github.com/samchon/prisma-markdown/ERD.md)