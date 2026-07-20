'use client';

import { useEffect, useRef } from 'react';
import { createNoise2D, hexToRgb, clamp, lerp } from '../utils/noise';

type Props = {
  width?: number;
  height?: number;
  colors?: string[];
  alpha?: number;
  quality?: number;
};

export default function Nebula({
  width,
  height,
  colors = ['#0b1026', '#1b3a52', '#6b3fa0'],
  alpha = 0.18,
  quality = 1,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;

    const cssW = width ?? window.innerWidth;
    const cssH = height ?? window.innerHeight;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const q = clamp(quality, 0.5, 1);
    let w = Math.max(32, Math.floor(cssW * dpr * q));
    let h = Math.max(32, Math.floor(cssH * dpr * q));

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    const c1 = hexToRgb(colors[0]);
    const c2 = hexToRgb(colors[1] ?? colors[0]);
    const c3 = hexToRgb(colors[2] ?? colors[1] ?? colors[0]);

    const { fbm } = createNoise2D(777);
    const img = ctx.createImageData(w, h);
    const data = img.data;

    const scale = 0.005;
    let idx = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = fbm(x * scale, y * scale, 5);
        const v = Math.pow(n, 1.8);
        const t1 = Math.min(1, v * 0.9);
        const t2 = Math.max(0, (v - 0.7) / 0.3);
        const r12 = lerp(c1[0], c2[0], t1);
        const g12 = lerp(c1[1], c2[1], t1);
        const b12 = lerp(c1[2], c2[2], t1);
        const rr = Math.round(lerp(r12, c3[0], t2));
        const gg = Math.round(lerp(g12, c3[1], t2));
        const bb = Math.round(lerp(b12, c3[2], t2));
        data[idx] = rr;
        data[idx + 1] = gg;
        data[idx + 2] = bb;
        data[idx + 3] = Math.round(alpha * 255 * (v * 0.6));
        idx += 4;
      }
    }
    ctx.putImageData(img, 0, 0);

    const onResize = () => {
      if (width != null && height != null) return;
      const el = ref.current;
      if (!el) return;
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      el.style.width = cw + 'px';
      el.style.height = ch + 'px';
      w = Math.max(32, Math.floor(cw * dpr * q));
      h = Math.max(32, Math.floor(ch * dpr * q));
      el.width = w;
      el.height = h;
      const img2 = ctx.createImageData(w, h);
      const data2 = img2.data;
      let i2 = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x * scale, y * scale, 5);
          const v = Math.pow(n, 1.8);
          const t1 = Math.min(1, v * 0.9);
          const t2 = Math.max(0, (v - 0.7) / 0.3);
          const r12 = lerp(c1[0], c2[0], t1);
          const g12 = lerp(c1[1], c2[1], t1);
          const b12 = lerp(c1[2], c2[2], t1);
          const rr = Math.round(lerp(r12, c3[0], t2));
          const gg = Math.round(lerp(g12, c3[1], t2));
          const bb = Math.round(lerp(b12, c3[2], t2));
          data2[i2] = rr;
          data2[i2 + 1] = gg;
          data2[i2 + 2] = bb;
          data2[i2 + 3] = Math.round(alpha * 255 * (v * 0.6));
          i2 += 4;
        }
      }
      ctx.putImageData(img2, 0, 0);
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [width, height, colors, alpha, quality]);

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}
