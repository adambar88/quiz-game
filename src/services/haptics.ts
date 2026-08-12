/**
 * Haptic Vibration Helper Service
 * Wraps navigator.vibrate with feature detection and standard patterns.
 */

export const haptics = {
  vibrateClick(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
  },

  vibrateSuccess(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([15, 30, 25]);
      } catch {
        // ignore
      }
    }
  },

  vibrateFailure(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([50, 40, 50]);
      } catch {
        // ignore
      }
    }
  },

  vibrateWarning(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {
        // ignore
      }
    }
  },
};
