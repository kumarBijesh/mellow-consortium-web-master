import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#092B4C",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#15A8A0",
            marginBottom: 28,
          }}
        >
          MELLOW Consortium
        </div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 800, maxWidth: 820, lineHeight: 1.15 }}>
          The Global Longevity Research Network
        </div>
      </div>
    ),
    { ...size }
  );
}
