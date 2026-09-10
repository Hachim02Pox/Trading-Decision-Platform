import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Static favicon version of the Zenith gyroscope mark. */
export default function Icon() {
  const ring = (transform: string) => ({
    position: "absolute" as const,
    inset: 8,
    border: "3px solid #d4a256",
    borderRadius: "50%",
    transform,
  });

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0d12" }}>
      <div style={{ width: 48, height: 48, display: "flex", position: "relative", transform: "rotate(-18deg)" }}>
        <div style={ring("rotate(0deg)")} />
        <div style={ring("rotate(60deg) scaleX(0.55)")} />
        <div style={ring("rotate(-48deg) scaleX(0.55)")} />
        <div style={{ position: "absolute", width: 7, height: 7, left: 21, top: 21, borderRadius: "50%", background: "#f4d08a" }} />
      </div>
    </div>,
    size
  );
}
