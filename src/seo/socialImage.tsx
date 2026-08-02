import { ImageResponse } from "next/og";

export const socialImageSize = { width: 1200, height: 630 } as const;

export function createSocialImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          padding: "72px 82px",
          color: "#c8fcff",
          background:
            "radial-gradient(circle at 78% 22%, #063a5f 0%, #001a30 24%, #000810 58%, #05020e 100%)",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 30,
            display: "flex",
            border: "2px solid rgba(0, 242, 255, 0.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 30,
            width: 150,
            height: 5,
            display: "flex",
            background: "#00f2ff",
            boxShadow: "0 0 24px #00f2ff",
          }}
        />
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              color: "#849495",
              fontSize: 22,
              letterSpacing: 6,
            }}
          >
            <span style={{ color: "#00f2ff" }}>●</span>
            <span>AETHERIS // PORTFOLIO SIGNAL</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                color: "#ffe16d",
                fontSize: 24,
                letterSpacing: 8,
              }}
            >
              FULL-STACK DEVELOPER
            </div>
            <div
              style={{
                display: "flex",
                color: "#e1fdff",
                fontSize: 82,
                fontWeight: 700,
                letterSpacing: -4,
              }}
            >
              NICKRASPY
            </div>
            <div
              style={{
                width: 760,
                display: "flex",
                color: "#9fb8bd",
                fontSize: 28,
                lineHeight: 1.45,
              }}
            >
              High-performance interfaces, secure data systems and immersive WebGL experiences.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#00f2ff",
              fontSize: 20,
              letterSpacing: 4,
            }}
          >
            <span>NICKRASPY // PORTFOLIO</span>
            <span style={{ color: "#849495" }}>STATUS // ONLINE</span>
          </div>
        </div>
      </div>
    ),
    socialImageSize,
  );
}
