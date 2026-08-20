export function CivicLensMark({ className = "h-14 w-14" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="CivicLens emblem: civic pillars within a lens"
      className={className}
    >
      <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <rect x="17" y="26" width="4" height="20" fill="currentColor" />
      <rect x="26" y="21" width="4" height="25" fill="currentColor" />
      <rect x="35" y="24" width="4" height="22" fill="currentColor" />
      <rect x="44" y="30" width="4" height="16" fill="currentColor" />
      <rect x="14" y="47" width="37" height="3" fill="currentColor" />
      <path d="M14 22 L32 12 L51 22" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
