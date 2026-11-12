import React from "react";
import { AbsoluteFill } from "remotion";
import { C, SANS } from "./theme";

/** Synthetic stand-in for a Mac settings window (1536x960 points). Used only to test overlays. */
export const FixtureScreen: React.FC = () => {
  const rows = ["General", "Voice", "Shortcuts", "Models", "Privacy", "About"];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg,#f4efe4,#ece5d6)", fontFamily: SANS }}>
      <div style={{ position: "absolute", left: 200, top: 110, width: 1136, height: 700, borderRadius: 18, background: "#fff", boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden", border: "1px solid #d9d5cb" }}>
        <div style={{ height: 52, background: "#f3f1ec", borderBottom: "1px solid #e1ddd2", display: "flex", alignItems: "center", gap: 9, paddingLeft: 18 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
          <div style={{ marginLeft: 24, fontSize: 17, color: "#555" }}>Juno Settings</div>
        </div>
        <div style={{ display: "flex", height: 648 }}>
          <div style={{ width: 300, background: "#f7f5f0", borderRight: "1px solid #e1ddd2", padding: 18 }}>
            {rows.map((r, i) => (
              <div key={r} style={{ height: 44, borderRadius: 9, padding: "0 14px", display: "flex", alignItems: "center", fontSize: 19, color: C.charcoal, background: i === 2 ? "#e4e1d8" : "transparent", marginBottom: 4 }}>{r}</div>
            ))}
          </div>
          <div style={{ flex: 1, padding: 40 }}>
            <div style={{ fontSize: 30, fontWeight: 600, color: C.charcoal, marginBottom: 30 }}>Shortcuts</div>
            {["Talk key", "Wake phrase", "Open Juno", "Pause listening"].map((r, i) => (
              <div key={r} style={{ height: 52, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 19, color: C.charcoal }}>
                <span>{r}</span><span style={{ color: "#888" }}>{["fn", "Hey Juno", "⌥ Space", "esc"][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
