import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          color: "#c8fcff",
          background: "linear-gradient(145deg, #001a30, #000810 62%, #05020e)",
          fontFamily: "monospace",
          fontSize: 92,
          fontWeight: 800,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 14,
            display: "flex",
            border: "3px solid #00f2ff",
            boxShadow: "inset 0 0 24px rgba(0, 242, 255, 0.18)",
          }}
        />
        <span>N</span>
        <span
          style={{
            position: "absolute",
            top: 20,
            right: 22,
            color: "#ffe16d",
            fontSize: 22,
          }}
        >
          ●
        </span>
      </div>
    ),
    size,
  );
}
