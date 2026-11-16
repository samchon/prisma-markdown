import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "links.prisma",
  datasource: {
    url: "localhost",
  },
});
