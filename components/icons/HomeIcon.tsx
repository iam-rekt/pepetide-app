type IconProps = { className?: string };

export default function HomeIcon({ className }: IconProps) {
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
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9.5" />
      <path d="M15 7.5c.6-1 1.7-1.5 2.6-1.1.6.3.9 1 .8 1.7-.2 1-1.2 1.6-2.2 1.4" />
    </svg>
  );
}
