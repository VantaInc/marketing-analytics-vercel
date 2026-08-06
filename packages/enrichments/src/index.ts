export type EnrichmentStatus = "ready" | "needs-input" | "error";

export type EnrichmentSummary = {
  id: string;
  label: string;
  status: EnrichmentStatus;
  source: string;
  updatedAt: string;
};

export function createEnrichmentSummary(input: {
  id: string;
  label: string;
  source?: string;
  status?: EnrichmentStatus;
}): EnrichmentSummary {
  return {
    id: input.id,
    label: input.label,
    source: input.source ?? "shared-enrichments",
    status: input.status ?? "ready",
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}
