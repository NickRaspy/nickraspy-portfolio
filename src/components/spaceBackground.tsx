"use client";

import { useEffect, useRef } from "react";
import {
  WEBGL_QUALITY_CONFIG,
  WEBGL_QUALITY_LEVELS,
  adaptWebGlQuality,
  createWebGlFpsState,
  type WebGlQuality,
} from "./webglQuality";

type Scene = {
  program: WebGLProgram;
  buffer: WebGLBuffer;
  position: number;
  resolution: WebGLUniformLocation;
  time: WebGLUniformLocation;
};

const FPS_SAMPLE_DURATION = 2500;

function buildFragmentSource(quality: WebGlQuality, floatPrecision: "highp" | "mediump") {
  const config = WEBGL_QUALITY_CONFIG[quality];
  const hashSource = quality === "low"
    ? `float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}`
    : `float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}`;
  const starSource = quality === "low" ? `
    vec2 tunnelUv=uv-vec2(0.0,0.02);
    float tunnelRadius=max(length(tunnelUv),0.018);
    float tunnelAngle=(atan(tunnelUv.y,tunnelUv.x)+3.14159265)/6.2831853;

    vec2 starUvA=vec2(tunnelAngle*96.0,log(tunnelRadius+0.075)*11.0-time*12.0);
    vec2 cellA=floor(starUvA);
    vec2 localA=fract(starUvA)-0.5;
    float seedA=hash(cellA);
    float radiusA=mix(0.075,0.115,hash(cellA+vec2(3.7,8.1)));
    float starA=(1.0-smoothstep(0.0,radiusA,length(vec2(localA.x*1.9,localA.y*0.34))))*step(0.972,seedA);

    vec2 starUvB=vec2(tunnelAngle*148.0,log(tunnelRadius+0.045)*15.0-time*15.0);
    vec2 cellB=floor(starUvB);
    vec2 localB=fract(starUvB)-0.5;
    float seedB=hash(cellB);
    float radiusB=mix(0.055,0.09,hash(cellB+vec2(6.2,1.9)));
    float starB=(1.0-smoothstep(0.0,radiusB,length(vec2(localB.x*2.1,localB.y*0.3))))*step(0.982,seedB);

    float tunnelFade=smoothstep(0.035,0.2,tunnelRadius)*(1.0-smoothstep(0.95,1.65,tunnelRadius));
    vec3 tintA=mix(vec3(0.62,0.88,1.0),vec3(1.0,0.88,0.62),hash(cellA+vec2(4.3,1.7)));
    vec3 stars=(tintA*starA+vec3(0.72,0.9,1.0)*starB*0.78)*tunnelFade;
  ` : `
    vec3 stars=vec3(0.0);
    for(float i=0.0;i<${config.starCount.toFixed(1)};i+=1.0){
      float seed=hash(vec2(i*7.17,i*3.91));
      float life=fract(seed+time*(0.25+hash(vec2(i,9.4))*0.20));
      float angle=hash(vec2(i*2.31,5.73))*6.2831853;
      vec2 direction=vec2(cos(angle),sin(angle));
      float radius=pow(life,1.7)*(1.15+hash(vec2(i,2.8))*0.85);
      vec2 starPosition=direction*radius;
      float size=mix(0.0012,0.0042,life);
      vec2 starDelta=uv-starPosition;
      vec2 tangent=vec2(-direction.y,direction.x);
      float lateralOffset=dot(starDelta,tangent);
      float radialOffset=dot(starDelta,direction);
      float streakScale=mix(0.58,0.28,life);
      float dotStar=smoothstep(size,0.0,length(vec2(lateralOffset*1.45,radialOffset*streakScale)));
      float fade=smoothstep(0.0,0.12,life)*smoothstep(1.0,0.72,life);
      vec3 starTint=mix(vec3(0.62,0.88,1.0),vec3(1.0,0.88,0.62),hash(vec2(i,1.2)));
      stars+=starTint*dotStar*fade*(0.55+life*0.8);
    }
  `;

  return `
    precision ${floatPrecision} float;
    uniform vec2 resolution;
    uniform float time;
    ${hashSource}
    float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}
    float fbm(vec2 p){float v=0.0;float a=0.5;mat2 rot=mat2(0.866,-0.5,0.5,0.866);for(int i=0;i<${config.fbmOctaves};++i){v+=a*noise(p);p=rot*p*2.0;a*=0.5;}return v;}
    void main(){
      vec2 uv=(gl_FragCoord.xy-0.5*resolution.xy)/resolution.y;
      float t=time*0.035;
      float q=fbm(uv*2.0-t*0.14);
      vec2 r=vec2(fbm(uv+q+t*0.07),fbm(uv+q-t*0.1));
      float f=fbm(uv+r*1.5);
      vec3 purple=vec3(0.08,0.01,0.15);
      vec3 blue=vec3(0.0,0.05,0.15);
      vec3 gold=vec3(0.15,0.10,0.05);
      vec3 color=mix(vec3(0.001,0.003,0.008),purple,clamp(q*1.2,0.0,1.0));
      color=mix(color,blue,clamp(r.x*1.3,0.0,1.0));
      color=mix(color,gold,clamp(r.y*f,0.0,1.0)*0.32);
      ${starSource}
      gl_FragColor=vec4(color*0.78+stars,1.0);
    }`;
}

function compileShader(targetGl: WebGLRenderingContext, source: string, type: number) {
  const shader = targetGl.createShader(type);
  if (!shader) return null;
  targetGl.shaderSource(shader, source);
  targetGl.compileShader(shader);
  if (!targetGl.getShaderParameter(shader, targetGl.COMPILE_STATUS)) {
    console.error(targetGl.getShaderInfoLog(shader));
    targetGl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createScene(targetGl: WebGLRenderingContext, quality: WebGlQuality): Scene | null {
  const precision = targetGl.getShaderPrecisionFormat(targetGl.FRAGMENT_SHADER, targetGl.HIGH_FLOAT)?.precision
    ? "highp"
    : "mediump";
  const vertex = compileShader(
    targetGl,
    "attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}",
    targetGl.VERTEX_SHADER,
  );
  const fragment = compileShader(targetGl, buildFragmentSource(quality, precision), targetGl.FRAGMENT_SHADER);
  if (!vertex || !fragment) {
    if (vertex) targetGl.deleteShader(vertex);
    if (fragment) targetGl.deleteShader(fragment);
    return null;
  }

  const program = targetGl.createProgram();
  if (!program) {
    targetGl.deleteShader(vertex);
    targetGl.deleteShader(fragment);
    return null;
  }
  targetGl.attachShader(program, vertex);
  targetGl.attachShader(program, fragment);
  targetGl.linkProgram(program);
  targetGl.deleteShader(vertex);
  targetGl.deleteShader(fragment);
  if (!targetGl.getProgramParameter(program, targetGl.LINK_STATUS)) {
    console.error(targetGl.getProgramInfoLog(program));
    targetGl.deleteProgram(program);
    return null;
  }

  const buffer = targetGl.createBuffer();
  const position = targetGl.getAttribLocation(program, "position");
  const resolution = targetGl.getUniformLocation(program, "resolution");
  const time = targetGl.getUniformLocation(program, "time");
  if (!buffer || position < 0 || !resolution || !time) {
    if (buffer) targetGl.deleteBuffer(buffer);
    targetGl.deleteProgram(program);
    return null;
  }
  targetGl.bindBuffer(targetGl.ARRAY_BUFFER, buffer);
  targetGl.bufferData(
    targetGl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    targetGl.STATIC_DRAW,
  );
  return { program, buffer, position, resolution, time };
}

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    let gl: WebGLRenderingContext | null = null;
    const scenes = new Map<WebGlQuality, Scene>();
    let currentScene: Scene | null = null;
    let qualityState = createWebGlFpsState(lowPower ? "low" : "high");
    let frame = 0;
    let active = !document.hidden;
    let contextLost = false;
    let sampleStartedAt = 0;
    let sampleFrames = 0;

    const setCanvasState = (state: "fallback" | "ready") => {
      canvas.dataset.webglState = state;
    };

    const activateQuality = (quality: WebGlQuality) => {
      const targetGl = gl;
      if (!targetGl || contextLost) return false;
      let scene = scenes.get(quality);
      if (!scene) {
        scene = createScene(targetGl, quality) ?? undefined;
        if (!scene) return false;
        scenes.set(quality, scene);
      }
      currentScene = scene;
      targetGl.useProgram(scene.program);
      targetGl.bindBuffer(targetGl.ARRAY_BUFFER, scene.buffer);
      targetGl.enableVertexAttribArray(scene.position);
      targetGl.vertexAttribPointer(scene.position, 2, targetGl.FLOAT, false, 0, 0);
      canvas.dataset.webglQuality = quality;
      return true;
    };

    const resize = () => {
      const targetGl = gl;
      const scene = currentScene;
      if (!targetGl || !scene || contextLost) return;
      const ratio = Math.min(window.devicePixelRatio || 1, WEBGL_QUALITY_CONFIG[qualityState.quality].maxDpr);
      const width = Math.max(1, Math.floor(window.innerWidth * ratio));
      const height = Math.max(1, Math.floor(window.innerHeight * ratio));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      targetGl.viewport(0, 0, width, height);
      targetGl.useProgram(scene.program);
      targetGl.uniform2f(scene.resolution, width, height);
    };

    const resetSampling = () => {
      sampleStartedAt = 0;
      sampleFrames = 0;
    };

    const render = (now = 0) => {
      const targetGl = gl;
      const scene = currentScene;
      if (!active || contextLost || !targetGl || !scene) return;
      targetGl.useProgram(scene.program);
      targetGl.uniform1f(scene.time, reduced ? 8 : now / 1000);
      targetGl.drawArrays(targetGl.TRIANGLE_STRIP, 0, 4);
      if (reduced) return;

      if (!sampleStartedAt) sampleStartedAt = now;
      sampleFrames += 1;
      const sampleDuration = now - sampleStartedAt;
      if (sampleDuration >= FPS_SAMPLE_DURATION) {
        const fps = sampleFrames * 1000 / sampleDuration;
        const nextState = adaptWebGlQuality(qualityState, fps);
        if (nextState.quality !== qualityState.quality) {
          if (activateQuality(nextState.quality)) {
            qualityState = nextState;
            resize();
          } else {
            qualityState = createWebGlFpsState(qualityState.quality);
          }
        } else {
          qualityState = nextState;
        }
        resetSampling();
      }
      frame = requestAnimationFrame(render);
    };

    const startRenderer = () => {
      cancelAnimationFrame(frame);
      resetSampling();
      if (!active || contextLost || !gl || !currentScene) return;
      if (reduced) render(performance.now());
      else frame = requestAnimationFrame(render);
    };

    const releaseScenes = (deleteResources: boolean) => {
      const targetGl = gl;
      if (targetGl && deleteResources && !targetGl.isContextLost()) {
        scenes.forEach((scene) => {
          targetGl.deleteBuffer(scene.buffer);
          targetGl.deleteProgram(scene.program);
        });
      }
      scenes.clear();
      currentScene = null;
    };

    const initializeRenderer = () => {
      gl = canvas.getContext("webgl", { antialias: false, alpha: false });
      if (!gl) {
        setCanvasState("fallback");
        return false;
      }

      const desiredIndex = WEBGL_QUALITY_LEVELS.indexOf(qualityState.quality);
      for (let index = desiredIndex; index >= 0; index -= 1) {
        const quality = WEBGL_QUALITY_LEVELS[index];
        if (activateQuality(quality)) {
          qualityState = createWebGlFpsState(quality);
          resize();
          setCanvasState("ready");
          return true;
        }
      }
      setCanvasState("fallback");
      return false;
    };

    const handleVisibility = () => {
      active = !document.hidden;
      cancelAnimationFrame(frame);
      resetSampling();
      if (active) startRenderer();
    };
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frame);
      resetSampling();
      releaseScenes(false);
      setCanvasState("fallback");
    };
    const handleContextRestored = () => {
      contextLost = false;
      qualityState = createWebGlFpsState(qualityState.quality);
      if (initializeRenderer()) startRenderer();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);
    if (initializeRenderer()) startRenderer();

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(frame);
      releaseScenes(true);
      gl = null;
    };
  }, []);

  return <canvas ref={canvasRef} className="space-background" data-webgl-state="fallback" aria-hidden="true" />;
}
