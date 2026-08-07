import path from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

const packageDirectory = path.dirname(fileURLToPath(import.meta.url));

config({
  path: path.resolve(packageDirectory, "../../.env"),
  quiet: true,
});

export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
  schema: "prisma/schema.prisma",
});
