import "server-only";

import {
  createGoogleSheetsConnector,
  parseGoogleServiceAccountJsonBase64,
} from "@vanta/google-sheets";

export type TeamMember = {
  email: string;
  name: string;
  /** Slack profile photo, when a token is configured. Initials render without. */
  photoUrl?: string;
  role: string;
};

/** Absent range means the roster tab does not exist yet; the section is omitted. */
export function isRosterConfigured(): boolean {
  return Boolean(process.env.TEAM_ROSTER_RANGE?.trim());
}

/**
 * Reads the roster from its own tab so joiners and leavers are a sheet edit
 * rather than a pull request. Photos are looked up separately by email — the
 * roster deliberately does not store image URLs, which would go stale the first
 * time someone changes their Slack picture.
 *
 * Never throws: a roster problem should cost the team section, not the page.
 */
export async function getTeamRoster(): Promise<TeamMember[]> {
  const range = process.env.TEAM_ROSTER_RANGE?.trim();
  const spreadsheetId = process.env.DASHBOARD_CATALOG_SPREADSHEET_ID?.trim();
  const serviceAccountJson =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64?.trim();

  if (!range || !spreadsheetId || !serviceAccountJson) {
    return [];
  }

  try {
    const sheets = createGoogleSheetsConnector(
      parseGoogleServiceAccountJsonBase64(serviceAccountJson),
    );
    const { rows } = await sheets.readRows({ range, spreadsheetId });
    const [header, ...body] = rows.map((row) =>
      row.map((cell) => String(cell ?? "").trim()),
    );

    if (!header) {
      return [];
    }

    const columns = header.map((cell) => cell.toLowerCase());

    return body.flatMap((cells) => {
      const record = Object.fromEntries(
        columns.map((column, index) => [column, cells[index] ?? ""]),
      );

      if (!record.name) {
        return [];
      }

      return [
        {
          email: record.email ?? "",
          name: record.name,
          role: record.role ?? record.title ?? "",
        },
      ];
    });
  } catch (cause) {
    console.error(`Failed to read the team roster from ${range}`, cause);

    return [];
  }
}
