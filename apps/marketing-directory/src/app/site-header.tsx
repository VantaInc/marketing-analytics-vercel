import Link from "next/link";

export type SiteHeaderProps = {
  /** Path of the page rendering the header, used to mark the active link. */
  current: string;
  /** Text beside the wordmark, e.g. "GTM Analytics - Marketing". */
  label: string;
  /**
   * This team's links. Empty on the home page, which carries no nav — the
   * team cards are the way in.
   */
  nav?: { href: string; label: string }[];
  viewerInitials?: string;
};

export function SiteHeader({
  current,
  label,
  nav = [],
  viewerInitials,
}: SiteHeaderProps) {
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
        <Link href="/" style={{ display: "block" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/new-vanta-wordmark-dark.svg"
            alt="Vanta"
            style={{ height: 18, display: "block" }}
          />
        </Link>
        <div
          style={{
            width: 1,
            height: 20,
            background: "var(--alp-token-border-default)",
          }}
        />
        <div
          style={{
            fontSize: "var(--alp-token-fontSize-bodyM)",
            fontWeight: 500,
            color: "var(--alp-token-text-secondary)",
          }}
        >
          {label}
        </div>
        {nav.length > 0 ? (
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {nav.map((item) => (
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
        ) : null}
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
