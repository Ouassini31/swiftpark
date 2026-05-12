import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt     = "SwiftPark — Trouvez une place de parking en temps réel";
export const size    = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #085041 0%, #22956b 60%, #1a7a58 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Cercles décoratifs */}
        <div style={{
          position: "absolute", top: -120, right: -120,
          width: 480, height: 480,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.08)",
          display: "flex",
        }} />
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 320, height: 320,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.12)",
          display: "flex",
        }} />
        <div style={{
          position: "absolute", bottom: -80, left: -80,
          width: 400, height: 400,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.06)",
          display: "flex",
        }} />

        {/* Pill badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 40,
          padding: "8px 20px",
          marginBottom: 32,
        }}>
          <span style={{ color: "#F4B400", fontSize: 16, marginRight: 8 }}>⚡</span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: 600, letterSpacing: "0.06em" }}>
            PARKING PARTAGÉ EN TEMPS RÉEL
          </span>
        </div>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
          {/* P stylisé */}
          <div style={{
            width: 80, height: 80,
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.3)",
            borderRadius: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 42,
            fontWeight: 900,
            color: "#fff",
          }}>
            🅿️
          </div>
          <span style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}>
            Swift<span style={{ color: "#F4B400" }}>Park</span>
          </span>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 28,
          fontWeight: 400,
          color: "rgba(255,255,255,0.75)",
          textAlign: "center",
          maxWidth: 680,
          lineHeight: 1.4,
          margin: 0,
        }}>
          Trouve une place · Partage la tienne · Gagne des SwiftCoins
        </p>

        {/* Stats row */}
        <div style={{
          display: "flex",
          gap: 16,
          marginTop: 48,
        }}>
          {[
            { emoji: "📍", label: "Temps réel" },
            { emoji: "🚗", label: "Entre conducteurs" },
            { emoji: "💰", label: "Récompenses SC" },
          ].map(({ emoji, label }) => (
            <div key={label} style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 12,
              padding: "10px 18px",
            }}>
              <span style={{ fontSize: 20 }}>{emoji}</span>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* URL */}
        <p style={{
          position: "absolute",
          bottom: 32,
          color: "rgba(255,255,255,0.4)",
          fontSize: 18,
          fontWeight: 400,
          letterSpacing: "0.02em",
          margin: 0,
        }}>
          swiftpark.fr
        </p>
      </div>
    ),
    { ...size }
  );
}
