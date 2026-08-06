const SLACK_AUTH_TEST_URL = "https://slack.com/api/auth.test";

export type SlackAuthTestResult = {
  botId?: string;
  enterpriseId?: string;
  raw: Record<string, unknown>;
  team?: string;
  teamId?: string;
  url?: string;
  user?: string;
  userId?: string;
};

export class SlackApiError extends Error {
  readonly code?: string;
  readonly method: string;
  readonly response?: Record<string, unknown>;
  readonly status: number;

  constructor({
    code,
    method,
    response,
    status,
  }: {
    code?: string;
    method: string;
    response?: Record<string, unknown>;
    status: number;
  }) {
    super(
      code
        ? `Slack API ${method} failed with ${code}.`
        : `Slack API ${method} failed.`,
    );
    this.name = "SlackApiError";
    this.code = code;
    this.method = method;
    this.response = response;
    this.status = status;
  }
}

/**
 * Lightweight Slack token diagnostic for apps that already have a token path.
 * Authorization-only starters should not call this until they intentionally add
 * Slack Web API access.
 */
export async function testSlackToken(
  token: string,
): Promise<SlackAuthTestResult> {
  const response = await fetch(SLACK_AUTH_TEST_URL, {
    body: JSON.stringify({}),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const body = await readSlackResponse(response);

  if (!response.ok || body.ok !== true) {
    throw new SlackApiError({
      code: typeof body.error === "string" ? body.error : undefined,
      method: "auth.test",
      response: body,
      status: response.status,
    });
  }

  return {
    botId: readString(body, "bot_id"),
    enterpriseId: readString(body, "enterprise_id"),
    raw: body,
    team: readString(body, "team"),
    teamId: readString(body, "team_id"),
    url: readString(body, "url"),
    user: readString(body, "user"),
    userId: readString(body, "user_id"),
  };
}

async function readSlackResponse(
  response: Response,
): Promise<Record<string, unknown>> {
  let value: unknown;

  try {
    value = await response.json();
  } catch {
    return {
      ok: false,
      error: "invalid_json",
    };
  }

  if (!isRecord(value)) {
    return {
      ok: false,
      error: "invalid_response",
    };
  }

  return value;
}

function readString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  return typeof value[key] === "string" ? value[key] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
