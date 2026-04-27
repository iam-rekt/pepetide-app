type IconProps = { className?: string };

export default function SyringeIcon({ className }: IconProps) {
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
      <path d="M17 3l4 4" />
      <path d="M19 5l-2.5 2.5" />
      <path d="M16.5 7.5 8 16l-3 3-2-2 3-3 8.5-8.5z" />
      <path d="M11 9l4 4" />
      <path d="M9 11l4 4" />
      <path d="M5 19l-2 2" />
    </svg>
  );
}
