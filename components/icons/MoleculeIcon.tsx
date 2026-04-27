type IconProps = { className?: string };

export default function MoleculeIcon({ className }: IconProps) {
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
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="18" cy="7" r="2.2" />
      <circle cx="12" cy="17" r="2.4" />
      <path d="M7.6 8.6 10.4 15.4" />
      <path d="M16.4 8.6 13.6 15.4" />
      <path d="M8.2 7h7.6" />
    </svg>
  );
}
