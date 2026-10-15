import { sql } from '@/lib/db';

export default async function Page() {
  const result = await sql`SELECT version()`;
  const version = result[0].version;

  return (
    <div>
      <h1>Database Connected</h1>
      <p>PostgreSQL version: {version}</p>
    </div>
  );
}