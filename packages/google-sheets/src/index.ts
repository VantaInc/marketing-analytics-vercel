import { createHash } from "node:crypto";
import { google, type sheets_v4 } from "googleapis";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export type GoogleServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  project_id?: string;
  token_uri?: string;
};

export type GoogleSheetCellValue = string | number | boolean | null;
export type GoogleSheetRow = GoogleSheetCellValue[];
export type GoogleSheetValueInputOption = "RAW" | "USER_ENTERED";

export type AppendGoogleSheetRowsInput = {
  credentials: GoogleServiceAccountCredentials;
  range: string;
  spreadsheetId: string;
  valueInputOption?: GoogleSheetValueInputOption;
  values: GoogleSheetRow[];
};

export type AppendGoogleSheetRowsResult = {
  spreadsheetId: string;
  tableRange?: string;
  updatedCells?: number;
  updatedColumns?: number;
  updatedRange?: string;
  updatedRows?: number;
};

export type ReadGoogleSheetRowsInput = {
  credentials: GoogleServiceAccountCredentials;
  majorDimension?: "ROWS" | "COLUMNS";
  range: string;
  spreadsheetId: string;
};

export type ReadGoogleSheetRowsResult = {
  range?: string;
  rows: GoogleSheetRow[];
  spreadsheetId: string;
};

export type GoogleSheetsConnector = {
  appendRows: (
    input: Omit<AppendGoogleSheetRowsInput, "credentials">,
  ) => Promise<AppendGoogleSheetRowsResult>;
  readRows: (
    input: Omit<ReadGoogleSheetRowsInput, "credentials">,
  ) => Promise<ReadGoogleSheetRowsResult>;
};

const sheetsClients = new Map<string, sheets_v4.Sheets>();

export function parseGoogleServiceAccountJsonBase64(
  value: string | undefined,
): GoogleServiceAccountCredentials {
  if (!value?.trim()) {
    throw new Error("Google service account JSON is required.");
  }

  let decoded: string;
  try {
    decoded = Buffer.from(value.trim(), "base64").toString("utf8");
  } catch {
    throw new Error("Google service account JSON must be base64 encoded.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new Error("Google service account JSON could not be parsed.");
  }

  if (!isRecord(parsed)) {
    throw new Error("Google service account JSON must be an object.");
  }

  const clientEmail = parsed.client_email;
  const privateKey = parsed.private_key;

  if (typeof clientEmail !== "string" || !clientEmail.trim()) {
    throw new Error("Google service account JSON is missing client_email.");
  }

  if (typeof privateKey !== "string" || !privateKey.trim()) {
    throw new Error("Google service account JSON is missing private_key.");
  }

  return {
    client_email: clientEmail,
    private_key: normalizePrivateKey(privateKey),
    project_id:
      typeof parsed.project_id === "string" ? parsed.project_id : undefined,
    token_uri:
      typeof parsed.token_uri === "string" ? parsed.token_uri : undefined,
  };
}

export function createGoogleSheetsConnector(
  credentials: GoogleServiceAccountCredentials,
): GoogleSheetsConnector {
  return {
    appendRows(input) {
      return appendGoogleSheetRows({
        ...input,
        credentials,
      });
    },
    readRows(input) {
      return readGoogleSheetRows({
        ...input,
        credentials,
      });
    },
  };
}

export async function readGoogleSheetRows({
  credentials,
  majorDimension = "ROWS",
  range,
  spreadsheetId,
}: ReadGoogleSheetRowsInput): Promise<ReadGoogleSheetRowsResult> {
  const normalizedSpreadsheetId = spreadsheetId.trim();
  const normalizedRange = range.trim();

  if (!normalizedSpreadsheetId) {
    throw new Error("Google Sheets spreadsheetId is required.");
  }

  if (!normalizedRange) {
    throw new Error("Google Sheets range is required.");
  }

  const sheets = getSheetsClient(credentials);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: normalizedSpreadsheetId,
    range: normalizedRange,
    majorDimension,
  });

  return {
    range: response.data.range ?? undefined,
    rows: (response.data.values ?? []) as GoogleSheetRow[],
    spreadsheetId: normalizedSpreadsheetId,
  };
}

export async function appendGoogleSheetRows({
  credentials,
  range,
  spreadsheetId,
  valueInputOption = "USER_ENTERED",
  values,
}: AppendGoogleSheetRowsInput): Promise<AppendGoogleSheetRowsResult> {
  const normalizedSpreadsheetId = spreadsheetId.trim();
  const normalizedRange = range.trim();

  if (!normalizedSpreadsheetId) {
    throw new Error("Google Sheets spreadsheetId is required.");
  }

  if (!normalizedRange) {
    throw new Error("Google Sheets range is required.");
  }

  if (values.length === 0) {
    throw new Error("At least one Google Sheets row is required.");
  }

  const sheets = getSheetsClient(credentials);
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: normalizedSpreadsheetId,
    range: normalizedRange,
    valueInputOption,
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values,
    },
  });

  return {
    spreadsheetId: response.data.spreadsheetId ?? normalizedSpreadsheetId,
    tableRange: response.data.tableRange ?? undefined,
    updatedCells: response.data.updates?.updatedCells ?? undefined,
    updatedColumns: response.data.updates?.updatedColumns ?? undefined,
    updatedRange: response.data.updates?.updatedRange ?? undefined,
    updatedRows: response.data.updates?.updatedRows ?? undefined,
  };
}

function getSheetsClient(
  credentials: GoogleServiceAccountCredentials,
): sheets_v4.Sheets {
  const cacheKey = getCredentialsCacheKey(credentials);
  const existingClient = sheetsClients.get(cacheKey);

  if (existingClient) {
    return existingClient;
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: normalizePrivateKey(credentials.private_key),
    scopes: [SHEETS_SCOPE],
  });
  const sheets = google.sheets({ auth, version: "v4" });
  sheetsClients.set(cacheKey, sheets);

  return sheets;
}

function getCredentialsCacheKey(
  credentials: GoogleServiceAccountCredentials,
): string {
  const privateKeyHash = createHash("sha256")
    .update(normalizePrivateKey(credentials.private_key))
    .digest("hex");

  return `${credentials.client_email}:${privateKeyHash}`;
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, "\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
