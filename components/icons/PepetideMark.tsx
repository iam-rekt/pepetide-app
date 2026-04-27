type IconProps = { className?: string };

export default function PepetideMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pepetide-mark-fill" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="55%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
      </defs>
      <path
        d="M18 4h12v6.5l5 9V36a8 8 0 0 1-8 8h-6a8 8 0 0 1-8-8V19.5l5-9V4Z"
        fill="url(#pepetide-mark-fill)"
        stroke="#0f172a"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d="M13 24h22" stroke="#0f172a" strokeWidth={2} strokeLinecap="round" />
      <circle cx="19" cy="30" r="1.4" fill="#0f172a" />
      <circle cx="24" cy="34" r="1.4" fill="#0f172a" />
      <circle cx="29" cy="29" r="1.4" fill="#0f172a" />
      <path d="M16 4h16" stroke="#0f172a" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}
