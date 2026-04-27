type IconProps = { className?: string };

export default function GearIcon({ className }: IconProps) {
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
      <path d="M12 2.5v2.8M12 18.7v2.8M21.5 12h-2.8M5.3 12H2.5M18.7 5.3l-2 2M7.3 16.7l-2 2M18.7 18.7l-2-2M7.3 7.3l-2-2" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.6" />
    </svg>
  );
}
