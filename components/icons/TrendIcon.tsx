type IconProps = { className?: string };

export default function TrendIcon({ className }: IconProps) {
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
      <path d="M3 17l5-5 4 3 5-7" />
      <path d="M14 8h5v5" />
      <path d="M3 21h18" />
    </svg>
  );
}
