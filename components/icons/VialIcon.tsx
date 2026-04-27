type IconProps = { className?: string };

export default function VialIcon({ className }: IconProps) {
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
      <path d="M9 3h6" />
      <path d="M9.5 3v3.5L7 11v7a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-7l-2.5-4.5V3" />
      <path d="M7.4 13h9.2" />
      <path d="M9.5 16.5h.01M12 18h.01M14.5 16.5h.01" />
    </svg>
  );
}
