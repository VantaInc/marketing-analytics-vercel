"use server";

import {
  createGoogleSheetsConnector,
  parseGoogleServiceAccountJsonBase64,
  type GoogleSheetsConnector,
} from "@vanta/google-sheets";

import type {
  IdeaSubmissionField,
  IdeaSubmissionState,
} from "./idea-submission-state";

const SOURCE_APP = "@vanta/starter";
const DEFAULT_IDEAS_RANGE = "Ideas!A:G";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldLimits = {
  accessNeeded: 500,
  appName: 80,
  description: 1000,
  submitterEmail: 254,
} satisfies Record<IdeaSubmissionField, number>;

type ValidatedIdea = Record<IdeaSubmissionField, string>;

let ideasSheet: GoogleSheetsConnector | null = null;
let ideasSheetConfig: { range: string; spreadsheetId: string } | null = null;

export async function submitInternalAppIdea(
  _previousState: IdeaSubmissionState,
  formData: FormData,
): Promise<IdeaSubmissionState> {
  const validation = validateIdeaSubmission(formData);

  if (!validation.ok) {
    return {
      fieldErrors: validation.fieldErrors,
      message: "Please fix the highlighted fields.",
      status: "error",
    };
  }

  const submittedAt = new Date().toISOString();

  try {
    const { range, spreadsheetId, sheet } = getIdeasSheet();

    await sheet.appendRows({
      range,
      spreadsheetId,
      values: [
        [
          submittedAt,
          SOURCE_APP,
          process.env.VERCEL_ENV ?? "development",
          validation.value.appName,
          validation.value.submitterEmail,
          validation.value.description,
          validation.value.accessNeeded,
        ],
      ],
    });

    return {
      fieldErrors: {},
      message: "Idea submitted.",
      status: "success",
      submittedAt,
    };
  } catch (error) {
    console.error("Failed to submit internal app idea.", error);

    return {
      fieldErrors: {},
      message: "We could not save that idea. Please try again later.",
      status: "error",
    };
  }
}

function getIdeasSheet(): {
  range: string;
  sheet: GoogleSheetsConnector;
  spreadsheetId: string;
} {
  if (ideasSheet && ideasSheetConfig) {
    return {
      ...ideasSheetConfig,
      sheet: ideasSheet,
    };
  }

  const credentials = parseGoogleServiceAccountJsonBase64(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64,
  );
  const spreadsheetId = process.env.INTERNAL_APP_IDEAS_SPREADSHEET_ID;
  const range = process.env.INTERNAL_APP_IDEAS_RANGE ?? DEFAULT_IDEAS_RANGE;

  if (!spreadsheetId?.trim()) {
    throw new Error("INTERNAL_APP_IDEAS_SPREADSHEET_ID is required.");
  }

  ideasSheet = createGoogleSheetsConnector(credentials);
  ideasSheetConfig = {
    range,
    spreadsheetId,
  };

  return {
    ...ideasSheetConfig,
    sheet: ideasSheet,
  };
}

function validateIdeaSubmission(formData: FormData):
  | { ok: true; value: ValidatedIdea }
  | {
      fieldErrors: Partial<Record<IdeaSubmissionField, string>>;
      ok: false;
    } {
  const value = {
    accessNeeded: readString(formData, "accessNeeded"),
    appName: readString(formData, "appName"),
    description: readString(formData, "description"),
    submitterEmail: readString(formData, "submitterEmail"),
  };
  const fieldErrors: Partial<Record<IdeaSubmissionField, string>> = {};

  for (const field of Object.keys(fieldLimits) as IdeaSubmissionField[]) {
    if (!value[field]) {
      fieldErrors[field] = "Required";
      continue;
    }

    if (value[field].length > fieldLimits[field]) {
      fieldErrors[field] = `Use ${fieldLimits[field]} characters or fewer.`;
    }
  }

  if (
    value.submitterEmail &&
    value.submitterEmail.length <= fieldLimits.submitterEmail &&
    !EMAIL_PATTERN.test(value.submitterEmail)
  ) {
    fieldErrors.submitterEmail = "Enter a valid email.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, ok: false };
  }

  return { ok: true, value };
}

function readString(formData: FormData, field: IdeaSubmissionField): string {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}
