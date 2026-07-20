import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/* No logo artwork exists yet and the design system forbids approximating a
   mark, so the icon is the wordmark's initial set in plain type on pine. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#12796A",
          color: "#FFFFFF",
          fontSize: 22,
          fontWeight: 500,
        }}
      >
        i
      </div>
    ),
    size,
  );
}
