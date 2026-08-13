import { LogIn } from "lucide-react";

import { getAuthSession } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import Directory from "./directory";

/** Re-read the catalog sheet at most every 5 minutes. */
export const revalidate = 300;

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function SignInScreen() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        className="card"
        style={{ maxWidth: 380, alignItems: "center", textAlign: "center" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/vanta-wordmark.svg"
          alt="Vanta"
          style={{ height: 18, display: "block", marginBottom: 4 }}
        />
        <div
          style={{
            fontSize: "var(--alp-token-fontSize-bodyL)",
            fontWeight: 600,
          }}
        >
          Marketing Reports
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--alp-token-fontSize-bodyM)",
            lineHeight: "var(--alp-token-lineHeight-bodyM)",
            color: "var(--alp-token-text-secondary)",
          }}
        >
          Sign in with your Vanta account to browse the dashboard directory.
        </p>
        <a
          className="chip"
          href="/api/auth/authorize"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 6,
            height: 36,
            padding: "0 16px",
            borderRadius: "var(--alp-token-borderRadius-button)",
            background: "var(--alp-token-bg-inverted)",
            borderColor: "var(--alp-token-bg-inverted)",
            color: "var(--alp-token-text-onColor)",
            fontSize: "var(--alp-token-fontSize-bodyM)",
            fontWeight: 500,
          }}
        >
          <LogIn size={14} />
          Sign in
        </a>
      </div>
    </main>
  );
}

export default async function Page() {
  const session = await getAuthSession();

  if (!session) {
    return <SignInScreen />;
  }

  const { dashboards, isSample } = await getCatalog();
  const viewer = session.user.name ?? session.user.email ?? "";

  return (
    <Directory
      dashboards={dashboards}
      isSample={isSample}
      viewerInitials={initials(viewer)}
    />
  );
}
