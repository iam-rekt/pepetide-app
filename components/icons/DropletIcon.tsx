type IconProps = { className?: string };

export default function DropletIcon({ className }: IconProps) {
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
      <path d="M12 3.2c2 3 6 7 6 10.5a6 6 0 1 1-12 0c0-3.5 4-7.5 6-10.5Z" />
      <path d="M9 14.5c.2 1.4 1.2 2.4 2.6 2.6" />
    </svg>
  );
}
