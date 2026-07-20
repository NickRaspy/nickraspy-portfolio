'use client'

import { useEffect, useRef, useState } from 'react'

interface CosmicGasProps {
    width?: number | string
    height?: number | string
    className?: string
    animated?: boolean
    animationSpeed?: number
    paletteCount?: number
}

export default function CosmicGas({
                                      width = '100%',
                                      height = '100vh',
                                      className = '',
                                      animated = true,
                                      animationSpeed = 0.1,
                                      paletteCount = 3
                                  }: CosmicGasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const animationRef = useRef<number>(0)
    const programRef = useRef<WebGLProgram | null>(null)
    const timeUniformRef = useRef<WebGLUniformLocation | null>(null)
    const resolutionUniformRef = useRef<WebGLUniformLocation | null>(null)
    const seedUniformRef = useRef<WebGLUniformLocation | null>(null)
    const paletteUniformRef = useRef<WebGLUniformLocation | null>(null)
    const paletteColorsRef = useRef<Float32Array>(new Float32Array(12))

    const [isInitialized, setIsInitialized] = useState(false)

    const generateRandomPalette = useRef(() => {
        const colors = []
        for (let i = 0; i < paletteCount; i++) {
            const hue = Math.random()
            const saturation = 0.2 + Math.random() * 0.3
            const lightness = 0.15 + Math.random() * 0.2
            colors.push(hue, saturation, lightness, 1.0)
        }

        while (colors.length < 12) {
            const hue = Math.random()
            const saturation = 0.2 + Math.random() * 0.3
            const lightness = 0.15 + Math.random() * 0.2
            colors.push(hue, saturation, lightness, 1.0)
        }

        return new Float32Array(colors)
    })

    const vertexShaderSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
      vUv = aPosition * 0.5 + 0.5;
    }
  `

    const fragmentShaderSource = `
    precision highp float;
    
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uSeed;
    uniform vec4 uPalette[3];
    
    varying vec2 vUv;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = random(i + vec2(0.0, 0.0) + uSeed);
      float b = random(i + vec2(1.0, 0.0) + uSeed);
      float c = random(i + vec2(0.0, 1.0) + uSeed);
      float d = random(i + vec2(1.0, 1.0) + uSeed);
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + 
             (c - a) * u.y * (1.0 - u.x) + 
             (d - b) * u.x * u.y;
    }
    
    float fbm(vec2 st, int octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for (int i = 0; i < 5; i++) {
        if (i >= octaves) break;
        value += amplitude * noise(st * frequency + vec2(uSeed, uSeed * 1.618));
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return value;
    }
    
    mat2 rotate(float a) {
      float s = sin(a);
      float c = cos(a);
      return mat2(c, -s, s, c);
    }
    
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    vec3 getPaletteColor(float t) {
      t = mod(t + uSeed, 1.0);
      float segment = t * float(${paletteCount});
      int index = int(floor(segment));
      float localT = fract(segment);
      
      vec4 color1, color2;
      
      if (index == 0) {
        color1 = uPalette[0];
        color2 = uPalette[1];
      } else if (index == 1) {
        color1 = uPalette[1];
        color2 = uPalette[2];
      } else {
        color1 = uPalette[2];
        color2 = uPalette[0];
      }
      
      vec3 hsv = mix(color1.rgb, color2.rgb, localT);
      return hsv2rgb(vec3(hsv.x, clamp(hsv.y, 0.2, 0.5), clamp(hsv.z, 0.15, 0.35)));
    }
    
    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / uResolution.y;
      
      vec2 adjustedUv = uv;
      if (aspect > 1.0) {
        adjustedUv.x = (adjustedUv.x - 0.5) * aspect + 0.5;
      } else {
        adjustedUv.y = (adjustedUv.y - 0.5) / aspect + 0.5;
      }
      
      float time = uTime * 0.1;
      float seedOffset = uSeed * 100.0;
      
      vec2 regionSt = adjustedUv * 4.0 + vec2(time * 0.05 + seedOffset, time * 0.03 + seedOffset * 1.618);
      float regionValue = fbm(regionSt, 3);
      
      vec2 gasSt = adjustedUv * 8.0 + vec2(time * 0.1 + seedOffset * 0.5, time * 0.07 + seedOffset * 2.4);
      gasSt = rotate(time * 0.05 + uSeed) * gasSt;
      
      float fbm1 = fbm(gasSt, 3);
      float fbm2 = fbm(gasSt + vec2(32.0 + uSeed * 50.0, 32.0 + uSeed * 30.0), 3);
      float perlin = fbm(gasSt + vec2(fbm1, fbm2), 3);
      
      float colorT = fract(regionValue + perlin * 0.3 + uSeed);
      vec3 color = getPaletteColor(colorT);
      
      float intensity = mix(0.5, 1.2, perlin);
      color *= intensity;
      
      color = pow(color, vec3(1.2));
      color *= smoothstep(0.1, 0.9, perlin);
      
      // Убрал круговое ограничение - теперь туман на весь экран
      gl_FragColor = vec4(color, 1.0);
    }
  `

    const initWebGL = useRef(() => {
        const canvas = canvasRef.current
        if (!canvas) return false

        const gl = canvas.getContext('webgl')
        if (!gl) return false

        glRef.current = gl

        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!
        gl.shaderSource(vertexShader, vertexShaderSource)
        gl.compileShader(vertexShader)

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShader))
            return false
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!
        gl.shaderSource(fragmentShader, fragmentShaderSource)
        gl.compileShader(fragmentShader)

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader))
            return false
        }

        const program = gl.createProgram()!
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program))
            return false
        }

        programRef.current = program
        gl.useProgram(program)

        const vertices = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ])

        const vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

        const positionLocation = gl.getAttribLocation(program, 'aPosition')
        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

        resolutionUniformRef.current = gl.getUniformLocation(program, 'uResolution')
        timeUniformRef.current = gl.getUniformLocation(program, 'uTime')
        seedUniformRef.current = gl.getUniformLocation(program, 'uSeed')
        paletteUniformRef.current = gl.getUniformLocation(program, 'uPalette[0]')

        paletteColorsRef.current = generateRandomPalette.current()

        gl.clearColor(0, 0, 0, 1)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        return true
    })

    const resizeCanvas = useRef(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        const gl = glRef.current
        if (!canvas || !container || !gl) return

        const { clientWidth, clientHeight } = container

        const dpr = window.devicePixelRatio || 1
        canvas.width = clientWidth * dpr
        canvas.height = clientHeight * dpr
        canvas.style.width = `${clientWidth}px`
        canvas.style.height = `${clientHeight}px`

        gl.viewport(0, 0, canvas.width, canvas.height)

        if (resolutionUniformRef.current) {
            gl.uniform2f(resolutionUniformRef.current, canvas.width, canvas.height)
        }
    })

    const render = useRef((time: number = 0) => {
        const gl = glRef.current
        if (!gl) return

        gl.clear(gl.COLOR_BUFFER_BIT)

        if (timeUniformRef.current) {
            gl.uniform1f(timeUniformRef.current, time * animationSpeed)
        }

        if (seedUniformRef.current) {
            gl.uniform1f(seedUniformRef.current, paletteColorsRef.current[0])
        }

        if (paletteUniformRef.current) {
            gl.uniform4fv(paletteUniformRef.current, paletteColorsRef.current)
        }

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    })

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        let isMounted = true
        let startTime = 0

        const init = () => {
            if (!isMounted) return

            if (!isInitialized) {
                if (initWebGL.current()) {
                    resizeCanvas.current()
                    setIsInitialized(true)
                }
            } else {
                resizeCanvas.current()
            }
        }

        const animate = (currentTime: number) => {
            if (!isMounted || !animated) return

            if (!startTime) startTime = currentTime
            const elapsedTime = (currentTime - startTime) / 1000

            render.current(elapsedTime)
            animationRef.current = requestAnimationFrame(animate)
        }

        init()

        if (animated && isInitialized) {
            animationRef.current = requestAnimationFrame(animate)
        } else if (isInitialized) {
            render.current(Math.random() * 1000)
        }

        const handleResize = () => {
            if (!isMounted) return

            if (animated && animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }

            resizeCanvas.current()

            if (animated && isInitialized) {
                startTime = 0
                animationRef.current = requestAnimationFrame(animate)
            } else if (isInitialized) {
                render.current(Math.random() * 1000)
            }
        }

        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(container)

        return () => {
            isMounted = false
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            resizeObserver.disconnect()
        }
    }, [animated, isInitialized, animationSpeed, paletteCount])

    return (
        <div
            ref={containerRef}
            className={`relative ${className}`}
            style={{ width, height }}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />
        </div>
    )
}