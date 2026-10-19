"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: "120px 24px", textAlign: "center", fontFamily: "sans-serif" }}>
          <h1 style={{ fontSize: 28, marginBottom: 12, color: "#092B4C" }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: 24, color: "#5b6b7b" }}>
            Please try again, or reload the page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#006EB6",
              color: "#fff",
              padding: "12px 22px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14.5,
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
