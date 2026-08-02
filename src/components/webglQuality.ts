export const WEBGL_QUALITY_LEVELS = ["low", "medium", "high"] as const;

export type WebGlQuality = (typeof WEBGL_QUALITY_LEVELS)[number];

export const WEBGL_QUALITY_CONFIG: Record<
  WebGlQuality,
  { maxDpr: number; fbmOctaves: number; starCount: number }
> = {
  low: { maxDpr: 0.75, fbmOctaves: 3, starCount: 0 },
  medium: { maxDpr: 1, fbmOctaves: 4, starCount: 40 },
  high: { maxDpr: 1.5, fbmOctaves: 5, starCount: 64 },
};

export type WebGlFpsState = {
  quality: WebGlQuality;
  slowWindows: number;
  fastWindows: number;
};

export function createWebGlFpsState(quality: WebGlQuality): WebGlFpsState {
  return { quality, slowWindows: 0, fastWindows: 0 };
}

export function adaptWebGlQuality(state: WebGlFpsState, fps: number): WebGlFpsState {
  if (!Number.isFinite(fps) || fps <= 0) return state;

  const qualityIndex = WEBGL_QUALITY_LEVELS.indexOf(state.quality);

  if (fps < 42) {
    const slowWindows = state.slowWindows + 1;
    if (slowWindows >= 2 && qualityIndex > 0) {
      return createWebGlFpsState(WEBGL_QUALITY_LEVELS[qualityIndex - 1]);
    }
    return { ...state, slowWindows, fastWindows: 0 };
  }

  if (fps > 56) {
    const fastWindows = state.fastWindows + 1;
    if (fastWindows >= 4 && qualityIndex < WEBGL_QUALITY_LEVELS.length - 1) {
      return createWebGlFpsState(WEBGL_QUALITY_LEVELS[qualityIndex + 1]);
    }
    return { ...state, slowWindows: 0, fastWindows };
  }

  return createWebGlFpsState(state.quality);
}
