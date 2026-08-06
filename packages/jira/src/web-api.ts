const ATLASSIAN_ACCESSIBLE_RESOURCES_URL =
  "https://api.atlassian.com/oauth/token/accessible-resources";

const DEFAULT_JIRA_ISSUE_FIELDS = [
  "summary",
  "status",
  "issuetype",
  "priority",
  "assignee",
  "created",
  "updated",
] as const;

export type JiraAccessibleResource = {
  avatarUrl?: string;
  id: string;
  name: string;
  scopes: string[];
  url: string;
};

export type JiraCurrentUser = {
  accountId?: string;
  accountType?: string;
  active?: boolean;
  displayName?: string;
  emailAddress?: string;
  locale?: string;
  timeZone?: string;
};

export type JiraIssueStatus = {
  name?: string;
  statusCategory?: {
    colorName?: string;
    key?: string;
    name?: string;
  };
};

export type JiraIssueFields = {
  assignee?: {
    accountId?: string;
    displayName?: string;
  } | null;
  created?: string;
  issuetype?: {
    name?: string;
  };
  priority?: {
    name?: string;
  } | null;
  status?: JiraIssueStatus;
  summary?: string;
  updated?: string;
};

export type JiraIssue = {
  fields?: JiraIssueFields;
  id: string;
  key: string;
  self?: string;
};

export type JiraSearchResult = {
  issues: JiraIssue[];
  maxResults?: number;
  nextPageToken?: string;
  startAt?: number;
  total?: number;
};

export type JiraBacklogSnapshot = {
  currentUser?: JiraCurrentUser;
  issues: JiraIssue[];
  resources: JiraAccessibleResource[];
  selectedResource?: JiraAccessibleResource;
  total?: number;
};

export type JiraBacklogSnapshotRequest = {
  cloudId?: string;
  jql: string;
  maxResults?: number;
  token: string;
};

export class JiraApiError extends Error {
  readonly method: string;
  readonly response?: Record<string, unknown>;
  readonly status: number;
  readonly url: string;

  constructor({
    method,
    response,
    status,
    url,
  }: {
    method: string;
    response?: Record<string, unknown>;
    status: number;
    url: string;
  }) {
    super(`Jira API ${method} ${url} failed with status ${status}.`);
    this.name = "JiraApiError";
    this.method = method;
    this.response = response;
    this.status = status;
    this.url = url;
  }
}

export async function fetchJiraAccessibleResources(
  token: string,
): Promise<JiraAccessibleResource[]> {
  const response = await fetch(ATLASSIAN_ACCESSIBLE_RESOURCES_URL, {
    headers: buildJiraHeaders(token),
    method: "GET",
  });
  const body = await readJiraResponse(response);

  if (!response.ok || !Array.isArray(body)) {
    throw new JiraApiError({
      method: "GET",
      response: isRecord(body) ? body : undefined,
      status: response.status,
      url: ATLASSIAN_ACCESSIBLE_RESOURCES_URL,
    });
  }

  return body.map(normalizeAccessibleResource).filter(isAccessibleResource);
}

export async function fetchJiraCurrentUser({
  cloudId,
  token,
}: {
  cloudId: string;
  token: string;
}): Promise<JiraCurrentUser> {
  const body = await fetchJiraCloudApi({
    cloudId,
    method: "GET",
    path: "/rest/api/3/myself",
    token,
  });

  return isRecord(body) ? normalizeCurrentUser(body) : {};
}

export async function searchJiraIssues({
  cloudId,
  fields = DEFAULT_JIRA_ISSUE_FIELDS,
  jql,
  maxResults = 25,
  token,
}: {
  cloudId: string;
  fields?: readonly string[];
  jql: string;
  maxResults?: number;
  token: string;
}): Promise<JiraSearchResult> {
  const body = await fetchJiraCloudApi({
    body: {
      fields: [...fields],
      jql,
      maxResults,
    },
    cloudId,
    method: "POST",
    path: "/rest/api/3/search/jql",
    token,
  });

  if (!isRecord(body)) {
    return {
      issues: [],
    };
  }

  return {
    issues: Array.isArray(body.issues)
      ? body.issues.map(normalizeIssue).filter(isJiraIssue)
      : [],
    maxResults: readNumber(body, "maxResults"),
    nextPageToken: readString(body, "nextPageToken"),
    startAt: readNumber(body, "startAt"),
    total: readNumber(body, "total"),
  };
}

export async function fetchJiraBacklogSnapshot({
  cloudId,
  jql,
  maxResults,
  token,
}: JiraBacklogSnapshotRequest): Promise<JiraBacklogSnapshot> {
  const resources = await fetchJiraAccessibleResources(token);
  const selectedResource =
    findResource(resources, cloudId) ?? findFirstJiraResource(resources);

  if (!selectedResource) {
    return {
      issues: [],
      resources,
    };
  }

  const [currentUser, searchResult] = await Promise.all([
    fetchJiraCurrentUser({
      cloudId: selectedResource.id,
      token,
    }),
    searchJiraIssues({
      cloudId: selectedResource.id,
      jql,
      maxResults,
      token,
    }),
  ]);

  return {
    currentUser,
    issues: searchResult.issues,
    resources,
    selectedResource,
    total: searchResult.total,
  };
}

async function fetchJiraCloudApi({
  body,
  cloudId,
  method,
  path,
  token,
}: {
  body?: Record<string, unknown>;
  cloudId: string;
  method: "GET" | "POST";
  path: string;
  token: string;
}): Promise<unknown> {
  const url = `https://api.atlassian.com/ex/jira/${encodeURIComponent(
    cloudId,
  )}${path}`;
  const response = await fetch(url, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...buildJiraHeaders(token),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    method,
  });
  const responseBody = await readJiraResponse(response);

  if (!response.ok) {
    throw new JiraApiError({
      method,
      response: isRecord(responseBody) ? responseBody : undefined,
      status: response.status,
      url,
    });
  }

  return responseBody;
}

function buildJiraHeaders(token: string): Record<string, string> {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function readJiraResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      error: "invalid_json",
      body: text,
    };
  }
}

function normalizeAccessibleResource(
  value: unknown,
): Partial<JiraAccessibleResource> {
  if (!isRecord(value)) {
    return {};
  }

  return {
    avatarUrl: readString(value, "avatarUrl"),
    id: readString(value, "id") ?? "",
    name: readString(value, "name") ?? "Jira site",
    scopes: Array.isArray(value.scopes)
      ? value.scopes.filter(
          (scope): scope is string => typeof scope === "string",
        )
      : [],
    url: readString(value, "url") ?? "",
  };
}

function isAccessibleResource(
  value: Partial<JiraAccessibleResource>,
): value is JiraAccessibleResource {
  return Boolean(value.id && value.url);
}

function findResource(
  resources: JiraAccessibleResource[],
  cloudId?: string,
): JiraAccessibleResource | undefined {
  const normalizedCloudId = cloudId?.trim();

  if (!normalizedCloudId) {
    return undefined;
  }

  return resources.find((resource) => resource.id === normalizedCloudId);
}

function findFirstJiraResource(
  resources: JiraAccessibleResource[],
): JiraAccessibleResource | undefined {
  return (
    resources.find((resource) => resource.url.includes(".atlassian.net")) ??
    resources[0]
  );
}

function normalizeCurrentUser(value: Record<string, unknown>): JiraCurrentUser {
  return {
    accountId: readString(value, "accountId"),
    accountType: readString(value, "accountType"),
    active: readBoolean(value, "active"),
    displayName: readString(value, "displayName"),
    emailAddress: readString(value, "emailAddress"),
    locale: readString(value, "locale"),
    timeZone: readString(value, "timeZone"),
  };
}

function normalizeIssue(value: unknown): Partial<JiraIssue> {
  if (!isRecord(value)) {
    return {};
  }

  return {
    fields: normalizeIssueFields(value.fields),
    id: readString(value, "id") ?? "",
    key: readString(value, "key") ?? "",
    self: readString(value, "self"),
  };
}

function isJiraIssue(value: Partial<JiraIssue>): value is JiraIssue {
  return Boolean(value.id && value.key);
}

function normalizeIssueFields(value: unknown): JiraIssueFields {
  if (!isRecord(value)) {
    return {};
  }

  return {
    assignee: isRecord(value.assignee)
      ? {
          accountId: readString(value.assignee, "accountId"),
          displayName: readString(value.assignee, "displayName"),
        }
      : null,
    created: readString(value, "created"),
    issuetype: isRecord(value.issuetype)
      ? {
          name: readString(value.issuetype, "name"),
        }
      : undefined,
    priority: isRecord(value.priority)
      ? {
          name: readString(value.priority, "name"),
        }
      : null,
    status: isRecord(value.status)
      ? {
          name: readString(value.status, "name"),
          statusCategory: isRecord(value.status.statusCategory)
            ? {
                colorName: readString(value.status.statusCategory, "colorName"),
                key: readString(value.status.statusCategory, "key"),
                name: readString(value.status.statusCategory, "name"),
              }
            : undefined,
        }
      : undefined,
    summary: readString(value, "summary"),
    updated: readString(value, "updated"),
  };
}

function readString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  return typeof value[key] === "string" ? value[key] : undefined;
}

function readNumber(
  value: Record<string, unknown>,
  key: string,
): number | undefined {
  return typeof value[key] === "number" ? value[key] : undefined;
}

function readBoolean(
  value: Record<string, unknown>,
  key: string,
): boolean | undefined {
  return typeof value[key] === "boolean" ? value[key] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
