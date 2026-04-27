type IconProps = { className?: string };

export default function CalendarIcon({ className }: IconProps) {
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
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <circle cx="8.5" cy="14" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
