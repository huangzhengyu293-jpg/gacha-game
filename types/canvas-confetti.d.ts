declare module 'canvas-confetti' {
  namespace confetti {
    export interface Options {
      particleCount?: number;
      angle?: number;
      spread?: number;
      startVelocity?: number;
      decay?: number;
      gravity?: number;
      drift?: number;
      ticks?: number;
      origin?: {
        x?: number;
        y?: number;
      };
      colors?: string[];
      shapes?: string[];
      scalar?: number;
      zIndex?: number;
      disableForReducedMotion?: boolean;
    }

    export interface CreateTypes {
      (options?: Options): Promise<null> | null;
      reset: () => void;
    }
  }

  interface ConfettiFunction {
    (options?: confetti.Options): Promise<null> | null;
    reset: () => void;
    create: (canvas: HTMLCanvasElement | null, options?: { resize?: boolean; useWorker?: boolean }) => confetti.CreateTypes;
  }

  const confetti: ConfettiFunction;
  export = confetti;
}

