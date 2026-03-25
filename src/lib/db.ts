import { neon, types } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL environment variable");
}

// Return all date/time types as strings (same behaviour as Supabase JS client)
types.setTypeParser(1082, (val: string) => val);              // DATE        → "YYYY-MM-DD"
types.setTypeParser(1114, (val: string) => val);              // TIMESTAMP   → ISO string
types.setTypeParser(1184, (val: string) => new Date(val).toISOString()); // TIMESTAMPTZ → ISO string

export const sql = neon(process.env.DATABASE_URL);
