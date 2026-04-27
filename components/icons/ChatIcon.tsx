type IconProps = { className?: string };

export default function ChatIcon({ className }: IconProps) {
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
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5V14a2.5 2.5 0 0 1-2.5 2.5H12l-4 3.5v-3.5H6.5A2.5 2.5 0 0 1 4 14V6.5Z" />
      <path d="M8.5 9.5h7" />
      <path d="M8.5 12.5h4.5" />
      <path d="M16.5 11c.8-.6 1.4-.4 1.7.2.2.5-.1 1.1-.7 1.4" />
    </svg>
  );
}
