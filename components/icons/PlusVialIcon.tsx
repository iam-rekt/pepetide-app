type IconProps = { className?: string };

export default function PlusVialIcon({ className }: IconProps) {
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
      <path d="M7 3h6" />
      <path d="M7.5 3v3.5L5.5 11v6.5a2.5 2.5 0 0 0 2.5 2.5h4a2.5 2.5 0 0 0 2.5-2.5V11l-2-4.5V3" />
      <path d="M5.7 13h8.6" />
      <path d="M19 14v6" />
      <path d="M16 17h6" />
    </svg>
  );
}
