import confetti from 'canvas-confetti';

export function fireConfetti(intensity: 'small' | 'medium' | 'large' = 'medium') {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (intensity === 'small') {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#7c3aed', '#f59e0b', '#10b981', '#3b82f6'],
      });
      return;
    }

    if (intensity === 'medium') {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'],
      });
      return;
    }

    // Large / Boss defeat / Level up
    const duration = 2.2 * 1000;
    const end = Date.now() + duration;

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: {
          x: Math.random(),
          y: Math.random() - 0.2,
        },
        colors: ['#ffc233', '#8b5cf6', '#10b981', '#38bdf8', '#f43f5e'],
      });
    }, 250);
  } catch {
    // Graceful fallback
  }
}
