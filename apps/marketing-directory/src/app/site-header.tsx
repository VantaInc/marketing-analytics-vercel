import Link from "next/link";

const NAV = [
  { href: "/", label: "Dashboards" },
  { href: "/offline-conversion", label: "Offline conversion values" },
];

export type SiteHeaderProps = {
  /** Path of the page rendering the header, used to mark the active tab. */
  current: string;
  viewerInitials?: string;
};

export function SiteHeader({ current, viewerInitials }: SiteHeaderProps) {
  return (
    <header
      style={{
        background: "var(--alp-token-bg-default)",
        borderBottom: "1px solid var(--alp-token-border-weak)",
        padding: "0 32px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/vanta-wordmark.svg"
          alt="Vanta"
          style={{ height: 18, display: "block" }}
        />
        <div
          style={{
            width: 1,
            height: 20,
            background: "var(--alp-token-border-default)",
          }}
        />
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              className="nav-link"
              href={item.href}
              data-active={item.href === current}
              aria-current={item.href === current ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {viewerInitials ? (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "var(--alp-token-purple-200)",
            color: "var(--alp-token-purple-1100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {viewerInitials}
        </div>
      ) : null}
    </header>
  );
}
