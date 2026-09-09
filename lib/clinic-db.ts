import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

const globalDatabase = globalThis as typeof globalThis & { clinicSql?: postgres.Sql };

export function database(): postgres.Sql {
  if (!globalDatabase.clinicSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Falta configurar DATABASE_URL.");
    globalDatabase.clinicSql = postgres(url, {
      prepare: false,
      max: 5,
      connect_timeout: 10,
      idle_timeout: 20,
      ssl: {
        rejectUnauthorized: true,
        ca: readFileSync(resolve(process.env.DATABASE_SSL_CA_PATH || "certs/supabase-ca.crt"), "utf8"),
      },
    });
  }
  return globalDatabase.clinicSql;
}

export function table(name: "patients" | "sessions" | "appointments" | "attempts") {
  const schema = process.env.CLINIC_DB_SCHEMA || "clinic";
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) throw new Error("Esquema de base de datos inválido.");
  return `${schema}.${name}`;
}
