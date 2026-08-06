import { Database } from "lucide-react";
import { listDomains, type DomainRow } from "@/lib/example_snowflake_call";

export const dynamic = "force-dynamic";

type Result =
  | { ok: true; rows: DomainRow[] }
  | { ok: false; error: string };

async function loadDomains(): Promise<Result> {
  try {
    const rows = await listDomains();
    return { ok: true, rows };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function SnowflakeExamplePage() {
  const result = await loadDomains();
  const columns = result.ok && result.rows[0] ? Object.keys(result.rows[0]) : [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center gap-3 border-b border-border pb-5">
          <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Database className="size-4" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Snowflake example</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <code>SELECT * FROM vanta.exports.vercel_dim_all_domains LIMIT 50</code>
            </p>
          </div>
        </header>

        {!result.ok ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
            <p className="text-sm font-medium text-destructive">Query failed</p>
            <pre className="mt-3 overflow-x-auto rounded-md bg-card p-3 font-mono text-xs">
              {result.error}
            </pre>
            <p className="mt-3 text-sm text-muted-foreground">
              Link shared environment variables to your project and make sure
              the project is hooked up to Vanta VSC secure compute network.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-3 text-sm text-muted-foreground">
              {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-border bg-background">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="px-3 py-2 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-b-0"
                    >
                      {columns.map((col) => (
                        <td key={col} className="px-3 py-2 align-top">
                          {formatCell(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
