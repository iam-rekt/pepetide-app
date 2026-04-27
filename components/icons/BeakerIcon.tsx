type IconProps = { className?: string };

export default function BeakerIcon({ className }: IconProps) {
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
      <path d="M8 3h8" />
      <path d="M9 3v5.5L4.5 18a2.5 2.5 0 0 0 2.3 3.5h10.4a2.5 2.5 0 0 0 2.3-3.5L15 8.5V3" />
      <path d="M6.5 14h11" />
      <path d="M9.5 17.5h.01M12 19h.01M14.5 17.5h.01" />
    </svg>
  );
}
