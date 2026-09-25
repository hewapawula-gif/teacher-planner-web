import { useState, useEffect } from "react";
import { supabase } from "./supabase";

// ── Change this password to something only you know ───────────────────────────
const ADMIN_PASSWORD = "slteacher2024";

interface Code {
  id: string;
  code: string;
  used: boolean;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
  label: string | null;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `TEACH-${part(4)}-${part(4)}`;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [label, setLabel] = useState("");
  const [days, setDays] = useState(14);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unused" | "used">("all");

  const login = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  const fetchCodes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("activation_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setCodes((data as Code[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchCodes();
  }, [authed]);

  const generate = async () => {
    setGenerating(true);
    let code = generateCode();
    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const { data } = await supabase.from("activation_codes").select("code").eq("code", code).maybeSingle();
      if (!data) break;
      code = generateCode();
      attempts++;
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    await supabase.from("activation_codes").insert({
      code,
      used: false,
      label: label.trim() || null,
      expires_at: expiresAt.toISOString(),
    });
    setLabel("");
    await fetchCodes();
    setGenerating(false);
  };

  const deleteCode = async (id: string) => {
    if (!confirm("Delete this code?")) return;
    await supabase.from("activation_codes").delete().eq("id", id);
    await fetchCodes();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = codes.filter(c =>
    filter === "all" ? true : filter === "used" ? c.used : !c.used
  );

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const daysLeft = (expires: string | null) => {
    if (!expires) return null;
    const diff = Math.ceil((new Date(expires).getTime() - Date.now()) / 86400000);
    return diff;
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: 340, boxShadow: "0 4px 32px #0001" }}>
          <div style={{ width: 52, height: 52, background: "#EFF6FF", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 26 }}>🔐</span>
          </div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#1e293b" }}>Admin Login</h2>
          <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14 }}>SL Teacher Planner</p>
          <input
            type="password"
            placeholder="Enter admin password"
            value={pw}
            onChange={e => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={e => e.key === "Enter" && login()}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 15,
              border: `1.5px solid ${pwError ? "#ef4444" : "#e2e8f0"}`,
              outline: "none", boxSizing: "border-box", marginBottom: 8,
            }}
          />
          {pwError && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 12px" }}>Incorrect password</p>}
          <button
            onClick={login}
            style={{
              width: "100%", padding: "13px", background: "#2563EB", color: "#fff",
              border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: "pointer",
            }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#2563EB", padding: "18px 28px", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 24 }}>🔑</span>
        <div>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>Activation Code Manager</div>
          <div style={{ color: "#93C5FD", fontSize: 13 }}>SL Teacher Planner — Admin</div>
        </div>
        <button
          onClick={() => setAuthed(false)}
          style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13 }}
        >
          Logout
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: "28px auto", padding: "0 16px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Codes", value: codes.length, color: "#2563EB", bg: "#EFF6FF" },
            { label: "Active (Unused)", value: codes.filter(c => !c.used).length, color: "#059669", bg: "#ECFDF5" },
            { label: "Used", value: codes.filter(c => c.used).length, color: "#DC2626", bg: "#FEF2F2" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Generate */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", marginBottom: 20, boxShadow: "0 1px 8px #0001" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Generate New Code</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              placeholder="Label (e.g. teacher name) — optional"
              value={label}
              onChange={e => setLabel(e.target.value)}
              style={{
                flex: 1, minWidth: 180, padding: "11px 14px", borderRadius: 10, fontSize: 14,
                border: "1.5px solid #e2e8f0", outline: "none",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "0 14px" }}>
              <span style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>Access days:</span>
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 14))}
                style={{ width: 52, padding: "8px 4px", border: "none", background: "transparent", fontSize: 15, fontWeight: 800, color: "#1e293b", outline: "none", textAlign: "center" }}
              />
            </div>
            <button
              onClick={generate}
              disabled={generating}
              style={{
                padding: "11px 22px", background: "#2563EB", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800,
                cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1, whiteSpace: "nowrap",
              }}
            >
              {generating ? "Generating…" : "+ Generate Code"}
            </button>
          </div>
        </div>

        {/* Filter + List */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 8px #0001" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e293b" }}>All Codes</h3>
            <div style={{ display: "flex", gap: 6 }}>
              {(["all", "unused", "used"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    border: "1.5px solid",
                    borderColor: filter === f ? "#2563EB" : "#e2e8f0",
                    background: filter === f ? "#2563EB" : "#fff",
                    color: filter === f ? "#fff" : "#64748b",
                    textTransform: "capitalize",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>No codes found</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(c => (
                <div
                  key={c.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 12,
                    background: c.used ? "#f8fafc" : "#F0FDF4",
                    border: `1.5px solid ${c.used ? "#e2e8f0" : "#86EFAC"}`,
                  }}
                >
                  {/* Status dot */}
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.used ? "#94a3b8" : "#22C55E", flexShrink: 0 }} />

                  {/* Code */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1.5, color: c.used ? "#94a3b8" : "#1e293b", fontFamily: "monospace" }}>
                      {c.code}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {c.label ? `${c.label} · ` : ""}
                      Created {fmt(c.created_at)}
                      {c.used && c.activated_at ? ` · Activated ${fmt(c.activated_at)}` : ""}
                      {c.expires_at ? ` · Expires ${fmt(c.expires_at)}` : ""}
                    </div>
                    {/* Expiry indicator for unused codes */}
                    {!c.used && c.expires_at && (() => {
                      const left = daysLeft(c.expires_at);
                      if (left === null) return null;
                      if (left < 0) return <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, marginTop: 2 }}>⚠ Code expired — activate before use</div>;
                      return null;
                    })()}
                    {/* Days remaining for used/active codes */}
                    {c.used && c.expires_at && (() => {
                      const left = daysLeft(c.expires_at);
                      if (left === null) return null;
                      if (left < 0) return <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, marginTop: 2 }}>Expired {Math.abs(left)} day{Math.abs(left) === 1 ? "" : "s"} ago</div>;
                      return <div style={{ fontSize: 11, color: left <= 3 ? "#DC2626" : "#059669", fontWeight: 700, marginTop: 2 }}>{left} day{left === 1 ? "" : "s"} remaining</div>;
                    })()}
                  </div>

                  {/* Status badge */}
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: c.used ? "#e2e8f0" : "#DCFCE7",
                    color: c.used ? "#64748b" : "#15803D",
                  }}>
                    {c.used ? "USED" : "ACTIVE"}
                  </span>

                  {/* Copy button */}
                  {!c.used && (
                    <button
                      onClick={() => copyCode(c.code)}
                      style={{
                        padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: copied === c.code ? "#DCFCE7" : "#EFF6FF",
                        color: copied === c.code ? "#15803D" : "#2563EB",
                        border: "none", cursor: "pointer",
                      }}
                    >
                      {copied === c.code ? "✓ Copied" : "Copy"}
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => deleteCode(c.id)}
                    style={{
                      padding: "7px 10px", borderRadius: 8, fontSize: 12,
                      background: "#FEF2F2", color: "#DC2626",
                      border: "none", cursor: "pointer",
                    }}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
