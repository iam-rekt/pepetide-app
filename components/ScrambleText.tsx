'use client';

import { useEffect, useState } from 'react';

const GLYPHS = '!@#$%^&*<>?/{}[]~`+=-_:;.,';

interface Props {
  text: string;
  speedMs?: number;
  scrambleEveryMs?: number;
  className?: string;
}

export default function ScrambleText({
  text,
  speedMs = 28,
  scrambleEveryMs = 55,
  className,
}: Props) {
  // Initialize fully revealed so SSR matches client first render (no hydration mismatch).
  const [revealed, setRevealed] = useState(text.length);
  const [, setTick] = useState(0);

  // On mount, reset to 0 to start the scramble-in animation.
  useEffect(() => {
    setRevealed(0);
  }, [text]);

  // Reveal one character at a time, left to right.
  useEffect(() => {
    if (revealed >= text.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), speedMs);
    return () => clearTimeout(t);
  }, [revealed, text.length, speedMs]);

  // Re-roll the unrevealed glyphs while we're still animating.
  useEffect(() => {
    if (revealed >= text.length) return;
    const i = setInterval(() => setTick((t) => t + 1), scrambleEveryMs);
    return () => clearInterval(i);
  }, [revealed, text.length, scrambleEveryMs]);

  const display = text
    .split('')
    .map((ch, idx) => {
      if (idx < revealed) return ch;
      if (ch === ' ') return ' ';
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    })
    .join('');

  return (
    <span className={className} aria-label={text}>
      {display}
    </span>
  );
}
