import "server-only";

import { Pool } from "pg";

declare global {
  var plus9DatabasePool: Pool | undefined;
}

export function getDatabasePool() {
  const connectionString = process.env.APP_DATABASE_URL;
  if (!connectionString) {
    throw new Error("APP_DATABASE_URL tanımlı değil.");
  }

  globalThis.plus9DatabasePool ??= new Pool({
    application_name: "90plus9-web",
    connectionString,
    idleTimeoutMillis: 30_000,
    max: 5,
  });

  return globalThis.plus9DatabasePool;
}
