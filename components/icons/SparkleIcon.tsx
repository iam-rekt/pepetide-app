type IconProps = { className?: string };

export default function SparkleIcon({ className }: IconProps) {
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
      <path d="M12 3c.4 3.6 2.4 5.6 6 6-3.6.4-5.6 2.4-6 6-.4-3.6-2.4-5.6-6-6 3.6-.4 5.6-2.4 6-6Z" />
      <path d="M19 14c.2 1.6 1 2.4 2.5 2.6-1.5.2-2.3 1-2.5 2.4-.2-1.4-1-2.2-2.5-2.4 1.5-.2 2.3-1 2.5-2.6Z" />
      <path d="M5 4c.15 1.2.75 1.8 1.9 2-1.15.2-1.75.8-1.9 2-.15-1.2-.75-1.8-1.9-2C4.25 5.8 4.85 5.2 5 4Z" />
    </svg>
  );
}
