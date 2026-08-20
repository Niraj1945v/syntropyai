import { useEffect, useState } from "react";

/** Simulated facility clock: starts near 10:05 AM and advances `speed`
 *  simulated minutes every real second, so a demo shows a full day quickly. */
export function useSimClock(speed = 1) {
  const [minute, setMinute] = useState(605);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setMinute((m) => (m + speed > 1320 ? 480 : m + speed));
    }, 1000);
    return () => clearInterval(id);
  }, [running, speed]);

  return { minute, setMinute, running, setRunning };
}
