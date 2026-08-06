export const ideaSubmissionFields = [
  "appName",
  "submitterEmail",
  "description",
  "accessNeeded",
] as const;

export type IdeaSubmissionField = (typeof ideaSubmissionFields)[number];

export type IdeaSubmissionState = {
  fieldErrors: Partial<Record<IdeaSubmissionField, string>>;
  message: string;
  status: "idle" | "success" | "error";
  submittedAt?: string;
};

export const initialIdeaSubmissionState: IdeaSubmissionState = {
  fieldErrors: {},
  message: "",
  status: "idle",
};
