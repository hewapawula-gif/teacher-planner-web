import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "./supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = "waiting" | "connecting" | "connected";
type PeriodType = "regular" | "current" | "off" | "relief";

interface Task {
  type: string;
  name: string;
  content: string;
}

interface Period {
  number: number;
  subject: string;
  class: string;
  type: PeriodType;
  start: string;
  end: string;
  tasks: Task[];
}

interface ConnectData {
  v: number;
  teacher: { name: string; gender: string; displayName: string };
  date: string;
  day: string;
  periods: Period[];
  serverUrl?: string;
}

// ── Colors (matching Flutter app) ─────────────────────────────────────────────
const C: Record<PeriodType, { bg: string; border: string; text: string; badge: string; dot: string }> = {
  current: { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B", badge: "#EF4444", dot: "#EF4444" },
  regular: { bg: "#F0FDF4", border: "#6EE7B7", text: "#065F46", badge: "#34D399", dot: "#10B981" },
  off:     { bg: "#F9FAFB", border: "#D1D5DB", text: "#374151", badge: "#9CA3AF", dot: "#9CA3AF" },
  relief:  { bg: "#FEFCE8", border: "#FDE68A", text: "#78350F", badge: "#FBBF24", dot: "#F59E0B" },
};

const TYPE_LABELS: Record<PeriodType, string> = { current: "NOW", regular: "", off: "OFF", relief: "RELIEF" };

function taskMeta(type: string) {
  switch (type) {
    case "video_link":        return { icon: "▶", color: "#6366F1", label: "Video Link" };
    case "video_file":        return { icon: "🎬", color: "#EF4444", label: "Video File" };
    case "audio_file":        return { icon: "🎵", color: "#8B5CF6", label: "Audio File" };
    case "voice_note":        return { icon: "🎙", color: "#EC4899", label: "Voice Note" };
    case "lesson_plan":       return { icon: "📄", color: "#059669", label: "Lesson Plan" };
    case "teaching_material": return { icon: "📚", color: "#F59E0B", label: "Material" };
    default:                  return { icon: "📎", color: "#3B5BDB", label: "File" };
  }
}

function isDownloadable(type: string) {
  return ["video_file", "audio_file", "voice_note"].includes(type);
}

// ── UUID generator ────────────────────────────────────────────────────────────
function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── QR Code component ─────────────────────────────────────────────────────────
function QRImage({ value, size = 240 }: { value: string; size?: number }) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      bgColor="#ffffff"
      fgColor="#1A1A2E"
      style={{ borderRadius: 8 }}
    />
  );
}

// ── Pulsing dot animation ─────────────────────────────────────────────────────
function LiveDot({ color = "#10B981" }: { color?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center w-3 h-3">
      <span className="pulse-ring absolute inline-flex w-full h-full rounded-full opacity-60" style={{ background: color }} />
      <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

// ── Waiting Screen ────────────────────────────────────────────────────────────
function WaitingScreen({ sessionId }: { sessionId: string }) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 600);
    return () => clearInterval(id);
  }, []);

  const steps = [
    { n: "1", text: "Open Teacher Planner on your phone" },
    { n: "2", text: 'Tap the 🔲 QR icon in the timetable header' },
    { n: "3", text: 'Tap "Scan Web QR" and point camera at the QR below' },
    { n: "4", text: "Your timetable will appear here automatically" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 40%, #F0FDF4 100%)" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-8 py-5 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#3B5BDB" }}>
          <span className="text-lg">📋</span>
        </div>
        <span className="font-extrabold text-lg" style={{ color: "#1A1A2E" }}>Teacher Planner Web</span>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
          <LiveDot color="#F59E0B" />
          <span className="text-xs font-bold text-amber-600">Waiting for phone{dots}</span>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* QR code */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute -inset-4 rounded-3xl opacity-30 blur-xl" style={{ background: "#3B5BDB" }} />
              <div className="relative bg-white rounded-3xl p-5 shadow-2xl shadow-indigo-200">
                <QRImage value={sessionId} size={220} />
                {/* Corner marks */}
                {[
                  { pos: "top-1 left-1",     s: { borderTop: "3px solid #3B5BDB", borderLeft: "3px solid #3B5BDB" } },
                  { pos: "top-1 right-1",    s: { borderTop: "3px solid #3B5BDB", borderRight: "3px solid #3B5BDB" } },
                  { pos: "bottom-1 left-1",  s: { borderBottom: "3px solid #3B5BDB", borderLeft: "3px solid #3B5BDB" } },
                  { pos: "bottom-1 right-1", s: { borderBottom: "3px solid #3B5BDB", borderRight: "3px solid #3B5BDB" } },
                ].map((c, i) => (
                  <div key={i} className={`absolute ${c.pos} w-5 h-5`} style={c.s} />
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-sm font-semibold">Session ID</p>
              <p className="mono text-xs text-slate-400 mt-1 select-all">{sessionId.slice(0, 16)}…</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl font-black leading-tight mb-3" style={{ color: "#1A1A2E" }}>
                Scan this QR with<br />your phone
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Open Teacher Planner, tap the QR icon, then scan this screen. Your full timetable will appear here instantly.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {steps.map((s) => (
                <div key={s.n} className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-white shadow-md" style={{ background: "#3B5BDB" }}>
                    {s.n}
                  </div>
                  <p className="text-slate-600 text-sm font-semibold leading-snug pt-1">{s.text}</p>
                </div>
              ))}
            </div>

            {/* Feature list */}
            <div className="flex flex-wrap gap-2">
              {["📅 Live timetable", "📁 File downloads", "🔴 Current period", "✅ Tasks"].map(f => (
                <span key={f} className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-indigo-100 text-slate-600 shadow-sm">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Connecting Screen ─────────────────────────────────────────────────────────
function ConnectingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)" }}>
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <div className="text-center">
        <p className="font-extrabold text-xl" style={{ color: "#1A1A2E" }}>Connecting…</p>
        <p className="text-slate-500 text-sm mt-1">Receiving timetable from your phone</p>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ data, onDisconnect }: { data: ConnectData; onDisconnect: () => void }) {
  const allTasks = data.periods.flatMap(p => p.tasks.map(t => ({ ...t, period: p })));
  const files = allTasks.filter(t => isDownloadable(t.type));
  const initial = data.teacher.name?.[0]?.toUpperCase() ?? "T";

  return (
    <aside className="flex flex-col h-full" style={{ width: 280, background: "#1E2F6B", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">📋</span>
          <span className="text-white font-extrabold text-sm">Teacher Planner</span>
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-400/15">
            <LiveDot color="#34D399" />
            <span className="text-[10px] font-bold text-emerald-300">Live</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
            {initial}
          </div>
          <div>
            <p className="text-white font-extrabold text-sm">{data.teacher.displayName}</p>
            <p className="text-white/50 text-[11px] font-semibold">Teacher</p>
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">{data.day}</p>
        <p className="text-white font-extrabold text-base">
          {new Date(data.date + "T00:00:00").toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Summary */}
      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Today at a glance</p>
        <div className="space-y-2">
          {(["current", "regular", "relief", "off"] as PeriodType[]).map(type => {
            const count = data.periods.filter(p => p.type === type).length;
            if (!count) return null;
            const labels: Record<PeriodType, string> = { current: "Now active", regular: "Class periods", relief: "Relief", off: "Free periods" };
            return (
              <div key={type} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: C[type].dot }} />
                <span className="text-white/60 text-xs font-semibold flex-1">{labels[type]}</span>
                <span className="mono text-white/80 text-xs font-bold">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Files */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Files to download</p>
        {files.length === 0 ? (
          <p className="text-white/30 text-xs font-semibold">No files attached today</p>
        ) : (
          <div className="space-y-2">
            {files.map((t, i) => {
              const m = taskMeta(t.type);
              const fileUrl = data.serverUrl
                ? `${data.serverUrl}/files/${encodeURIComponent(t.content.split("/").pop() ?? t.content)}`
                : t.content;
              return (
                <a key={i} href={fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span className="text-base flex-shrink-0">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{t.name}</p>
                    <p className="text-white/40 text-[10px] font-semibold">Period {t.period.number}</p>
                  </div>
                  <span className="text-white/30 group-hover:text-white/70 transition-colors">↓</span>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Disconnect */}
      <div className="px-5 py-4 border-t border-white/10">
        <button onClick={onDisconnect}
          className="w-full py-2 rounded-xl text-xs font-bold text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70 transition-all">
          Disconnect
        </button>
      </div>
    </aside>
  );
}

// ── Period Row ────────────────────────────────────────────────────────────────
function PeriodRow({ period, isSelected, onClick }: { period: Period; isSelected: boolean; onClick: () => void }) {
  const c = C[period.type];
  const isOff = period.type === "off";
  const label = TYPE_LABELS[period.type];

  return (
    <div onClick={onClick}
      className="period-card flex items-center gap-4 rounded-2xl border px-5 py-4 cursor-pointer"
      style={{
        background: isSelected ? c.border + "20" : c.bg,
        borderColor: isSelected ? c.border : c.border + "66",
        outline: isSelected ? `2px solid ${c.border}` : undefined,
        boxShadow: period.type === "current" ? "0 4px 20px rgba(239,68,68,0.15)" : undefined,
      }}>
      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black"
        style={{ background: c.border + "30", color: c.text }}>{period.number}</div>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-sm truncate" style={{ color: c.text }}>{isOff ? "Off Period" : period.subject}</p>
        <p className="mono text-[11px] font-medium mt-0.5" style={{ color: c.text, opacity: 0.6 }}>{period.start} – {period.end}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {!isOff && period.class && (
          <span className="text-xs font-black px-2.5 py-0.5 rounded-lg" style={{ background: c.badge + "25", color: c.text }}>{period.class}</span>
        )}
        {label && (
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: c.badge + "22", color: c.badge }}>{label}</span>
        )}
      </div>
      {period.tasks.length > 0 && (
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0" style={{ background: "#3B5BDB" }}>
          {period.tasks.length}
        </div>
      )}
      <span className="text-slate-300 font-bold text-sm">{isSelected ? "▾" : "›"}</span>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({ period, serverUrl }: { period: Period; serverUrl?: string }) {
  const c = C[period.type];
  const isOff = period.type === "off";
  const label = TYPE_LABELS[period.type];

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar">
      <div className="px-8 py-6 border-b border-slate-200" style={{ background: c.bg }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
            style={{ background: c.badge + "30", color: c.text }}>{period.number}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-2xl font-black" style={{ color: c.text }}>{isOff ? "Off Period" : period.subject}</h3>
              {label && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: c.badge + "22", color: c.badge }}>{label}</span>}
            </div>
            <p className="mono text-sm font-medium mt-1" style={{ color: c.text, opacity: 0.6 }}>{period.start} – {period.end}</p>
          </div>
          {!isOff && period.class && (
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-black" style={{ color: c.badge }}>{period.class}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Class</div>
            </div>
          )}
        </div>
      </div>

      <div className="px-8 py-6">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
          Attached Tasks & Files {period.tasks.length > 0 && <span className="text-indigo-500 ml-1">{period.tasks.length}</span>}
        </h4>
        {period.tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-3xl">📎</span>
            <p className="text-slate-400 text-sm font-semibold">No tasks for this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {period.tasks.map((t, i) => {
              const m = taskMeta(t.type);
              const canOpen = t.type === "video_link" || (isDownloadable(t.type) && (serverUrl || t.content.startsWith("http")));
              const fileUrl = serverUrl ? `${serverUrl}/files/${encodeURIComponent(t.content.split("/").pop() ?? t.content)}` : t.content;
              const handleOpen = () => {
                if (t.type === "video_link") window.open(t.content, "_blank");
                else if (canOpen) window.open(fileUrl, "_blank");
              };
              return (
                <div key={i} onClick={handleOpen}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${canOpen ? "cursor-pointer hover:shadow-md" : ""} transition-all`}
                  style={{ background: m.color + "0d", borderColor: m.color + "33" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: m.color + "1a" }}>
                    <span>{m.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: "#111827" }}>{t.name}</p>
                    <p className="text-[10px] font-semibold" style={{ color: m.color }}>{m.label}</p>
                  </div>
                  {canOpen && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: m.color + "1a" }}>
                      <span className="text-xs font-bold" style={{ color: m.color }}>{t.type === "video_link" ? "↗" : "↓"}</span>
                    </div>
                  )}
                  {!canOpen && t.type !== "video_link" && (
                    <span className="text-[10px] text-slate-400 font-semibold">Enable server to download</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ data, onDisconnect }: { data: ConnectData; onDisconnect: () => void }) {
  const [selected, setSelected] = useState<number | null>(() => {
    const i = data.periods.findIndex(p => p.type === "current");
    return i >= 0 ? i : null;
  });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const currentTime = now.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", hour12: true });
  const selectedPeriod = selected !== null ? data.periods[selected] : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar data={data} onDisconnect={onDisconnect} />
      <div className="flex-1 flex overflow-hidden" style={{ background: "#F8F9FF" }}>
        {/* Period list */}
        <div className="flex flex-col border-r border-slate-200" style={{ width: 420 }}>
          <div className="px-6 py-5 border-b border-slate-200 bg-white">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-black" style={{ color: "#111827" }}>Today's Timetable</h2>
              <span className="mono text-xs font-semibold text-slate-400">{currentTime}</span>
            </div>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">{data.periods.length} periods · tap to view details</p>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4 space-y-2">
            {data.periods.map((p, i) => (
              <div key={i} className="fade-up" style={{ animationDelay: `${i * 35}ms` }}>
                <PeriodRow period={p} isSelected={selected === i} onClick={() => setSelected(selected === i ? null : i)} />
              </div>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedPeriod ? (
            <DetailPanel period={selectedPeriod} serverUrl={data.serverUrl} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "#EEF2FF" }}>📋</div>
              <p className="font-extrabold text-slate-700 text-lg">Select a period</p>
              <p className="text-slate-400 text-sm max-w-xs">Click any period on the left to see details, tasks, and files.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [sessionId] = useState<string>(() => uuid());
  const [connectData, setConnectData] = useState<ConnectData | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Subscribe to Supabase realtime for this session
  useEffect(() => {
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as { id: string; data: ConnectData };
          if (row?.data) {
            setPhase("connecting");
            setTimeout(() => {
              setConnectData(row.data);
              setPhase("connected");
            }, 1200);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const disconnect = useCallback(() => {
    setConnectData(null);
    setPhase("waiting");
  }, []);

  if (phase === "waiting") return <WaitingScreen sessionId={sessionId} />;
  if (phase === "connecting") return <ConnectingScreen />;
  if (phase === "connected" && connectData) return <Dashboard data={connectData} onDisconnect={disconnect} />;
  return <WaitingScreen sessionId={sessionId} />;
}
