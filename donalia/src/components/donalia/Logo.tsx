/**
 * Logo validé « D + cercle d'impact » : un D monoline dont la panse se remplit
 * (arc doré = la part financée). Même geste que la jauge de financement.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex shrink-0 items-center justify-center"
      aria-hidden
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <rect width="100" height="100" rx="24" fill="#16403B" />
        <g fill="none" strokeLinecap="round" transform="translate(26,18)">
          <path d="M17 13.5 V50.5" strokeWidth="6.5" stroke="#F4EEE3" />
          <path d="M18.88 49.90 A18 18 0 0 1 18.88 14.10" strokeWidth="6.5" stroke="#F4EEE3" />
          <path d="M18.88 49.90 A18 18 0 0 1 34.47 36.35" strokeWidth="6.5" stroke="#4E9C7F" />
        </g>
      </svg>
    </span>
  );
}

export function Wordmark({ size = 23 }: { size?: number }) {
  return (
    <span className="dn-word" style={{ fontSize: size }}>
      Donalia<span className="dot" />
    </span>
  );
}

export function Logo({ size = 34, word = 23 }: { size?: number; word?: number }) {
  return (
    <span className="brand">
      <LogoMark size={size} />
      <Wordmark size={word} />
    </span>
  );
}
