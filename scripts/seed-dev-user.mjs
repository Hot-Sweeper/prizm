import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

await sql`
  INSERT INTO "user" (id, name, email)
  VALUES ('dev-user-001', 'Dev User', 'tim@redemann.info')
  ON CONFLICT (id) DO NOTHING
`;

console.log("Dev user created");
await sql.end();
