type IconProps = { className?: string };

export default function ScrollIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 5a2 2 0 0 1 2-2h11v15a3 3 0 0 0 3 3H8a3 3 0 0 1-3-3V5Z" />
      <path d="M5 5a2 2 0 0 0-2 2v1h2" />
      <path d="M9 8h7" />
      <path d="M9 12h7" />
      <path d="M9 16h4" />
    </svg>
  );
}
