import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import {
  Search, LayoutGrid, List, Plus, Filter, ChevronDown, ChevronLeft, ChevronRight, X, Play, Pause,
  MoreVertical, Activity, Zap, Clock, CheckCircle2, XCircle, AlertTriangle, AlertOctagon,
  TrendingUp, TrendingDown, Users, GitBranch, Calendar, CalendarClock, ArrowUpDown,
  Facebook, Instagram, MessageCircle, ShoppingBag, Send, Layers,
  BarChart3, PieChart as PieChartIcon, Sparkles, RefreshCw, Copy,
  Archive, Trash2, ExternalLink, Gauge, Timer, Server, Upload, FileJson,
  Settings2, Info, Check, Hash, Workflow as WorkflowIcon, MousePointerClick,
  Split, Database, Camera, Bell, ShieldAlert, Crown, Award, Medal,
} from "lucide-react";

/* ============================================================
   DESIGN TOKENS — FarmRouter terminal-noir
   ============================================================ */
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";
const FONT_DISPLAY = "'Space Grotesk', 'JetBrains Mono', sans-serif";

const COLORS = {
  bg: "#0A0D13",
  surface: "#10141B",
  surface2: "#141922",
  surface3: "#1A2029",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.14)",
  textPrimary: "#E7EBF0",
  textSecondary: "#8A93A3",
  textMuted: "#5B6472",
  lime: "#B9F04E",
  cyan: "#4EE1F0",
  amber: "#F0A857",
  red: "#F0574E",
  purple: "#B78CF0",
  pink: "#F0578C",
  blue: "#4E8CF0",
};

const STATUS_META = {
  active: { label: "Đang chạy", color: COLORS.lime, bg: "rgba(185,240,78,0.12)" },
  paused: { label: "Tạm dừng", color: COLORS.amber, bg: "rgba(240,168,87,0.12)" },
  error: { label: "Lỗi", color: COLORS.red, bg: "rgba(240,87,78,0.12)" },
  draft: { label: "Bản nháp", color: COLORS.textSecondary, bg: "rgba(138,147,163,0.12)" },
  archived: { label: "Lưu trữ", color: "#6B7280", bg: "rgba(107,114,128,0.10)" },
};

const PLATFORM_META = {
  facebook: { label: "Facebook", color: COLORS.blue, icon: Facebook },
  instagram: { label: "Instagram", color: COLORS.pink, icon: Instagram },
  tiktok: { label: "TikTok", color: "#E7EBF0", icon: Sparkles },
  zalo: { label: "Zalo", color: "#4EC5F0", icon: MessageCircle },
  telegram: { label: "Telegram", color: "#4EAFF0", icon: Send },
  shopee: { label: "Shopee", color: COLORS.amber, icon: ShoppingBag },
  multi: { label: "Đa nền tảng", color: COLORS.purple, icon: Layers },
};

const TRIGGER_META = {
  schedule: { label: "Lịch chạy", icon: Calendar },
  webhook: { label: "Webhook", icon: Zap },
  manual: { label: "Thủ công", icon: Play },
  event: { label: "Sự kiện", icon: Activity },
};

const NODE_TYPE_META = {
  trigger: { label: "Kích hoạt", color: COLORS.cyan, icon: Zap },
  condition: { label: "Điều kiện", color: COLORS.amber, icon: Split },
  action: { label: "Hành động", color: COLORS.lime, icon: MousePointerClick },
  data: { label: "Dữ liệu", color: COLORS.blue, icon: Database },
  capture: { label: "Chụp/Log", color: COLORS.purple, icon: Camera },
  end: { label: "Kết thúc", color: COLORS.textSecondary, icon: CheckCircle2 },
};

const ACTION_NODE_NAMES = [
  "Chờ ngẫu nhiên 3-8s", "Gõ nội dung bình luận", "Click nút Like", "Cuộn trang ngẫu nhiên",
  "Kiểm tra checkpoint", "Rẽ nhánh theo kết quả", "Gửi tin nhắn", "Gọi API nội bộ",
  "Lưu log kết quả", "Chụp ảnh màn hình", "Đổi proxy", "Đăng nhập tài khoản",
  "Kiểm tra điều kiện thời gian", "Ghi dữ liệu vào kho", "Thoát nếu bị chặn",
];

/* ------------------------------------------------------------
   Seeded PRNG để mock data ổn định
   ------------------------------------------------------------ */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(88421);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

const WORKFLOW_TEMPLATES = [
  { name: "Nuôi nick Facebook mới", desc: "Warm-up tài khoản mới: kết bạn, thả cảm xúc, đăng bài tự động theo lịch giãn cách." },
  { name: "Auto seeding bình luận Fanpage", desc: "Rải bình luận vào bài viết đối thủ/khách hàng theo kịch bản đa giọng văn." },
  { name: "Đăng bài hàng loạt TikTok", desc: "Đăng video lên nhiều tài khoản TikTok theo khung giờ vàng, kèm caption xoay vòng." },
  { name: "Auto reply Messenger", desc: "Trả lời tin nhắn khách hàng theo kịch bản phân nhánh, chuyển tiếp nhân viên khi cần." },
  { name: "Check trạng thái tài khoản", desc: "Quét định kỳ trạng thái checkpoint/khoá của toàn bộ farm tài khoản." },
  { name: "Sync đơn hàng Shopee", desc: "Đồng bộ đơn hàng mới, cập nhật trạng thái vận chuyển về hệ thống nội bộ." },
  { name: "Auto follow Instagram", desc: "Follow/unfollow theo tập đối tượng mục tiêu, kiểm soát tốc độ tránh giới hạn." },
  { name: "Gửi tin nhắn hàng loạt Zalo", desc: "Gửi chương trình khuyến mãi tới danh sách khách hàng đã gắn nhãn." },
  { name: "Auto report vi phạm", desc: "Report hàng loạt bài viết/trang vi phạm theo danh sách được cấu hình." },
  { name: "Đồng bộ kho nội dung", desc: "Kéo nội dung từ nguồn, xử lý spin văn bản và đẩy vào hàng chờ đăng bài." },
  { name: "Cảnh báo tài khoản die", desc: "Phát hiện tài khoản bị khoá/die và tự động gắn cờ, thay thế trong farm." },
  { name: "Auto like & share bài viết", desc: "Tương tác like/share cho bộ bài viết chỉ định trên nhiều tài khoản." },
  { name: "Rút trích số điện thoại Zalo", desc: "Quét danh bạ, trích xuất SĐT hoạt động Zalo phục vụ chiến dịch." },
  { name: "Auto checkout đơn giả lập", desc: "Giả lập hành vi mua hàng để kiểm thử luồng thanh toán Shopee." },
  { name: "Cảnh báo spam/report ngược", desc: "Theo dõi tỉ lệ report nhận về, tạm dừng chiến dịch khi vượt ngưỡng." },
  { name: "Auto đổi proxy theo tài khoản", desc: "Luân phiên proxy cho từng tài khoản theo chu kỳ để giảm rủi ro khoá." },
  { name: "Telegram broadcast kênh", desc: "Đăng nội dung đồng loạt lên nhiều kênh/group Telegram được quản lý." },
  { name: "Auto điểm danh nhận thưởng", desc: "Thực hiện điểm danh minigame hàng ngày trên các tài khoản farm." },
];

const OWNERS = ["Minh Anh", "Quốc Bảo", "Thu Hà", "Đức Huy", "Ngọc Lan", "Văn Phát"];
const TAG_POOL = ["seeding", "warm-up", "sale", "chăm sóc KH", "chống spam", "báo cáo", "content", "proxy"];
const ERROR_POOL = [
  "Tài khoản bị checkpoint giữa phiên chạy",
  "Timeout kết nối proxy sau 30s",
  "API rate limit từ nền tảng đích",
  "Node 'Gửi tin nhắn' trả về lỗi 429",
  "Không tìm thấy phần tử DOM mục tiêu",
  "Mất kết nối trình duyệt ảo",
  "Tài khoản bị đăng xuất bất thường",
];

function genRunHistory(days, baseRuns) {
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const runs = Math.max(0, Math.round(baseRuns * (0.6 + rand() * 0.8)));
    const failed = Math.round(runs * rand() * 0.18);
    out.push({ date: `${d.getDate()}/${d.getMonth() + 1}`, runs, success: runs - failed, failed });
  }
  return out;
}

function genRunLog(count, status, workflowName) {
  const out = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const isError = rand() < (status === "error" ? 0.55 : 0.08);
    out.push({
      id: `log-${workflowName}-${i}`,
      workflowName,
      time: new Date(now - i * randInt(9, 240) * 60000),
      status: isError ? "failed" : "success",
      duration: randInt(4, 95),
      accountsUsed: randInt(1, 40),
      error: isError ? pick(ERROR_POOL) : null,
    });
  }
  return out;
}

function buildNodePreview(nodeCount, seedName) {
  const s = mulberry32(seedName.length * 97 + nodeCount * 13);
  const nodes = [];
  nodes.push({ id: "n0", label: "Bắt đầu / Kích hoạt", type: "trigger" });
  for (let i = 1; i < nodeCount - 1; i++) {
    const r = s();
    const type = r < 0.18 ? "condition" : r < 0.3 ? "data" : r < 0.4 ? "capture" : "action";
    const name = ACTION_NODE_NAMES[Math.floor(s() * ACTION_NODE_NAMES.length)];
    nodes.push({ id: `n${i}`, label: name, type });
  }
  nodes.push({ id: `n${nodeCount - 1}`, label: "Kết thúc", type: "end" });
  return nodes;
}

function buildWorkflows() {
  const statuses = ["active", "active", "active", "paused", "error", "draft", "archived"];
  const platforms = Object.keys(PLATFORM_META);
  const triggers = Object.keys(TRIGGER_META);

  return WORKFLOW_TEMPLATES.map((tpl, idx) => {
    const status = pick(statuses);
    const platform = idx % 6 === 5 ? "multi" : pick(platforms.filter((p) => p !== "multi"));
    const trigger = pick(triggers);
    const nodeCount = randInt(4, 22);
    const totalRuns = status === "draft" ? 0 : randInt(120, 48000);
    const failRate = status === "error" ? 0.22 + rand() * 0.2 : rand() * 0.12;
    const failedRuns = Math.round(totalRuns * failRate);
    const successRuns = totalRuns - failedRuns;
    const successRate = totalRuns ? Math.round((successRuns / totalRuns) * 1000) / 10 : 0;
    const avgDuration = randInt(8, 320);
    const createdDaysAgo = randInt(20, 400);
    const lastRunMinsAgo = status === "draft" ? null : randInt(2, 2880);
    const accountsInUse = randInt(3, 260);
    const runHistory = genRunHistory(14, Math.max(1, Math.round(totalRuns / 60)));
    const runLog = status === "draft" ? [] : genRunLog(12, status, tpl.name);
    const hourlyLoad = Array.from({ length: 24 }, (_, h) => ({
      hour: h, runs: Math.round(Math.max(0, Math.sin((h - 3) / 24 * Math.PI * 2) * 40 + 45 + rand() * 20)),
    }));

    return {
      id: `wf-${String(idx + 1).padStart(3, "0")}`,
      name: tpl.name,
      description: tpl.desc,
      status,
      platform,
      trigger,
      schedule: trigger === "schedule" ? pick(["Mỗi 30 phút", "Hàng ngày lúc 08:00", "Mỗi 2 giờ", "Thứ 2-6, 09:00", "Mỗi 15 phút"]) : null,
      nodeCount,
      totalRuns,
      successRuns,
      failedRuns,
      successRate,
      avgDuration,
      accountsInUse,
      errorCount24h: status === "error" ? randInt(8, 60) : randInt(0, 5),
      lastRunAt: lastRunMinsAgo != null ? new Date(Date.now() - lastRunMinsAgo * 60000) : null,
      lastRunStatus: lastRunMinsAgo != null ? (rand() < failRate ? "failed" : "success") : null,
      nextRunAt: status === "active" && trigger === "schedule" ? new Date(Date.now() + randInt(5, 180) * 60000) : null,
      createdAt: new Date(Date.now() - createdDaysAgo * 86400000),
      updatedAt: new Date(Date.now() - randInt(0, createdDaysAgo) * 86400000),
      owner: pick(OWNERS),
      tags: Array.from(new Set([pick(TAG_POOL), pick(TAG_POOL)])),
      version: `v1.${randInt(0, 9)}.${randInt(0, 9)}`,
      runHistory,
      runLog,
      hourlyLoad,
      nodes: buildNodePreview(nodeCount, tpl.name),
      concurrency: randInt(1, 8),
      retryPolicy: pick(["Không thử lại", "Thử lại tối đa 2 lần", "Thử lại tối đa 5 lần", "Thử lại vô hạn (nguy hiểm)"]),
      notifyOnError: rand() > 0.4,
    };
  });
}

const BASE_WORKFLOWS = buildWorkflows();

/* ------------------------------------------------------------
   Helpers định dạng
   ------------------------------------------------------------ */
function timeAgo(date) {
  if (!date) return "—";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  return `${Math.round(diffH / 24)} ngày trước`;
}
function timeUntil(date) {
  if (!date) return "—";
  const diffMin = Math.round((date.getTime() - Date.now()) / 60000);
  if (diffMin < 60) return `sau ${diffMin} phút`;
  return `sau ${Math.round(diffMin / 60)} giờ`;
}
function fmtNumber(n) { return n.toLocaleString("vi-VN"); }
function fmtDuration(sec) {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}p${sec % 60 ? ` ${sec % 60}s` : ""}`;
}
function fmtDate(d) { return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }); }
function fmtClock(d) { return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); }
function initials(name) { return name.split(" ").map((s) => s[0]).slice(-2).join(""); }

/* ============================================================
   ATOMS
   ============================================================ */
function Pill({ color, bg, children, icon: Icon }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ color, backgroundColor: bg, fontFamily: FONT_MONO, letterSpacing: "0.02em" }}>
      {Icon && <Icon size={11} />}{children}
    </span>
  );
}

function KpiCard({ label, value, delta, deltaGood, icon: Icon, accent }) {
  return (
    <div className="relative rounded-lg p-4 overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.08] blur-2xl rounded-full" style={{ background: accent }} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-wider" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>{label}</span>
        <Icon size={15} style={{ color: accent }} />
      </div>
      <div className="text-2xl font-semibold" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>{value}</div>
      {delta != null && (
        <div className="flex items-center gap-1 mt-1.5 text-[11px]" style={{ fontFamily: FONT_MONO }}>
          {deltaGood ? <TrendingUp size={11} style={{ color: COLORS.lime }} /> : <TrendingDown size={11} style={{ color: COLORS.red }} />}
          <span style={{ color: deltaGood ? COLORS.lime : COLORS.red }}>{delta}</span>
          <span style={{ color: COLORS.textMuted }}>so với 7 ngày trước</span>
        </div>
      )}
    </div>
  );
}

function Sparkline({ data, color }) {
  const gid = `spark-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="runs" stroke={color} strokeWidth={1.5} fill={`url(#${gid})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatusDot({ status }) {
  const meta = STATUS_META[status];
  return (
    <span className="relative inline-flex h-2 w-2">
      {status === "active" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: meta.color }} />}
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: meta.color }} />
    </span>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md px-3 py-2 text-[11px]" style={{ background: "#0D1017", border: `1px solid ${COLORS.borderStrong}`, fontFamily: FONT_MONO }}>
      <div className="mb-1" style={{ color: COLORS.textMuted }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <b style={{ color: COLORS.textPrimary }}>{fmtNumber(p.value)}</b>
        </div>
      ))}
    </div>
  );
}

/* Generic modal shell */
function ModalShell({ onClose, size = "md", children }) {
  const width = size === "lg" ? "max-w-4xl" : size === "xl" ? "max-w-5xl" : "max-w-lg";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: FONT_MONO }}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} max-h-[90vh] overflow-y-auto rounded-xl`}
        style={{ background: COLORS.bg, border: `1px solid ${COLORS.borderStrong}`, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        {children}
      </div>
    </div>
  );
}

function TabStrip({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 px-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 text-[12px] font-medium relative transition-colors"
          style={{ color: active === t.key ? COLORS.textPrimary : COLORS.textMuted, fontFamily: FONT_DISPLAY }}>
          <t.icon size={13} /> {t.label}
          {active === t.key && <span className="absolute left-2 right-2 -bottom-px h-[2px] rounded-full" style={{ background: COLORS.lime }} />}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   NODE DIAGRAM PREVIEW (SVG tĩnh)
   ============================================================ */
function NodeDiagramPreview({ nodes, compact = false }) {
  const cols = compact ? 3 : 4;
  const boxW = compact ? 118 : 132;
  const boxH = compact ? 40 : 46;
  const gapX = compact ? 34 : 46;
  const gapY = compact ? 50 : 64;
  const pad = 24;

  const positions = nodes.map((n, i) => {
    const row = Math.floor(i / cols);
    const posInRow = i % cols;
    const col = row % 2 === 0 ? posInRow : cols - 1 - posInRow;
    return { ...n, x: pad + col * (boxW + gapX), y: pad + row * (boxH + gapY) };
  });
  const width = pad * 2 + cols * boxW + (cols - 1) * gapX;
  const rows = Math.ceil(nodes.length / cols);
  const height = pad * 2 + rows * boxH + (rows - 1) * gapY;

  return (
    <div className="rounded-lg overflow-auto" style={{ background: "#0D1017", border: `1px solid ${COLORS.border}`, maxHeight: compact ? 220 : 340 }}>
      <svg width={width} height={height} style={{ display: "block", minWidth: "100%" }}>
        {positions.slice(0, -1).map((n, i) => {
          const next = positions[i + 1];
          const x1 = n.x + boxW / 2, y1 = n.y + boxH / 2;
          const x2 = next.x + boxW / 2, y2 = next.y + boxH / 2;
          return (
            <path key={`edge-${i}`} d={`M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`}
              fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={1.5} markerEnd="url(#arrowhead)" />
          );
        })}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgba(255,255,255,0.28)" />
          </marker>
        </defs>
        {positions.map((n) => {
          const meta = NODE_TYPE_META[n.type];
          return (
            <g key={n.id} transform={`translate(${n.x},${n.y})`}>
              <rect width={boxW} height={boxH} rx={7} fill={COLORS.surface} stroke={meta.color} strokeWidth={1.3} />
              <rect width={4} height={boxH} rx={2} fill={meta.color} />
              <text x={12} y={boxH / 2 - 4} fill={meta.color} fontSize="8" fontFamily={FONT_MONO} style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {meta.label}
              </text>
              <text x={12} y={boxH / 2 + 12} fill={COLORS.textPrimary} fontSize="9.5" fontFamily={FONT_MONO}>
                {n.label.length > 20 ? n.label.slice(0, 20) + "…" : n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================
   CREATE WORKFLOW MODAL
   ============================================================ */
function CreateWorkflowModal({ onClose, onCreate }) {
  const [step, setStep] = useState("info"); // info | trigger | preview
  const [form, setForm] = useState({
    name: "", description: "", platform: "facebook", trigger: "manual",
    schedule: "Hàng ngày lúc 08:00", owner: OWNERS[0], tags: [], startTemplate: "blank",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTag = (t) => setForm((f) => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] }));

  const previewNodeCount = form.startTemplate === "blank" ? 2 : form.startTemplate === "basic" ? 6 : 12;
  const previewNodes = useMemo(() => buildNodePreview(previewNodeCount, form.name || "workflow-moi"), [previewNodeCount, form.name]);

  const canNext = step === "info" ? form.name.trim().length > 2 : true;

  return (
    <ModalShell onClose={onClose} size="lg">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "rgba(185,240,78,0.12)" }}>
            <Plus size={15} style={{ color: COLORS.lime }} />
          </div>
          <h2 className="text-[15px] font-semibold" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>Tạo workflow mới</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5" style={{ color: COLORS.textMuted }}><X size={17} /></button>
      </div>

      <TabStrip
        tabs={[
          { key: "info", label: "Thông tin cơ bản", icon: Info },
          { key: "trigger", label: "Kích hoạt & Lịch", icon: CalendarClock },
          { key: "preview", label: "Xem trước", icon: WorkflowIcon },
        ]}
        active={step} onChange={setStep}
      />

      <div className="p-5 min-h-[360px]" style={{ fontFamily: FONT_MONO }}>
        {step === "info" && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase mb-1.5" style={{ color: COLORS.textMuted }}>Tên workflow *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="VD: Nuôi nick Facebook đợt 12"
                className="w-full px-3 py-2 rounded-md text-[13px] outline-none" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }} />
            </div>
            <div>
              <label className="block text-[11px] uppercase mb-1.5" style={{ color: COLORS.textMuted }}>Mô tả</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Mô tả ngắn về mục tiêu của workflow..."
                className="w-full px-3 py-2 rounded-md text-[12.5px] outline-none resize-none" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase mb-1.5" style={{ color: COLORS.textMuted }}>Nền tảng</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(PLATFORM_META).map(([k, v]) => (
                    <button key={k} onClick={() => set("platform", k)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] transition-colors"
                      style={{ border: `1px solid ${form.platform === k ? v.color : COLORS.border}`, color: form.platform === k ? v.color : COLORS.textSecondary, background: form.platform === k ? "rgba(255,255,255,0.04)" : "transparent" }}>
                      <v.icon size={11} /> {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase mb-1.5" style={{ color: COLORS.textMuted }}>Người phụ trách</label>
                <select value={form.owner} onChange={(e) => set("owner", e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-[12.5px] outline-none" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}>
                  {OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase mb-1.5" style={{ color: COLORS.textMuted }}>Thẻ gắn nhãn</label>
              <div className="flex flex-wrap gap-1.5">
                {TAG_POOL.map((t) => (
                  <button key={t} onClick={() => toggleTag(t)}
                    className="px-2 py-1 rounded text-[10.5px] transition-colors"
                    style={{ background: form.tags.includes(t) ? "rgba(185,240,78,0.14)" : "rgba(255,255,255,0.04)", color: form.tags.includes(t) ? COLORS.lime : COLORS.textMuted }}>
                    #{t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "trigger" && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase mb-1.5" style={{ color: COLORS.textMuted }}>Loại kích hoạt</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(TRIGGER_META).map(([k, v]) => (
                  <button key={k} onClick={() => set("trigger", k)}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-md text-[11px] transition-colors"
                    style={{ border: `1px solid ${form.trigger === k ? COLORS.lime : COLORS.border}`, color: form.trigger === k ? COLORS.lime : COLORS.textSecondary }}>
                    <v.icon size={16} /> {v.label}
                  </button>
                ))}
              </div>
            </div>
            {form.trigger === "schedule" && (
              <div>
                <label className="block text-[11px] uppercase mb-1.5" style={{ color: COLORS.textMuted }}>Tần suất chạy</label>
                <select value={form.schedule} onChange={(e) => set("schedule", e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-[12.5px] outline-none" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}>
                  {["Mỗi 15 phút", "Mỗi 30 phút", "Mỗi 2 giờ", "Hàng ngày lúc 08:00", "Thứ 2-6, 09:00"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[11px] uppercase mb-1.5" style={{ color: COLORS.textMuted }}>Điểm khởi tạo node</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "blank", label: "Trống", desc: "Chỉ có node bắt đầu" },
                  { key: "basic", label: "Cơ bản", desc: "~6 node mẫu" },
                  { key: "full", label: "Đầy đủ", desc: "~12 node mẫu" },
                ].map((t) => (
                  <button key={t.key} onClick={() => set("startTemplate", t.key)}
                    className="text-left px-3 py-2.5 rounded-md transition-colors"
                    style={{ border: `1px solid ${form.startTemplate === t.key ? COLORS.cyan : COLORS.border}` }}>
                    <div className="text-[12px] font-medium" style={{ color: form.startTemplate === t.key ? COLORS.cyan : COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>{t.label}</div>
                    <div className="text-[10.5px] mt-0.5" style={{ color: COLORS.textMuted }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3">
            <div className="rounded-lg p-3.5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <div className="text-[13px] font-medium mb-1" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>{form.name || "(chưa đặt tên)"}</div>
              <div className="text-[11.5px] mb-2" style={{ color: COLORS.textSecondary }}>{form.description || "Chưa có mô tả."}</div>
              <div className="flex flex-wrap gap-1.5">
                <Pill color={PLATFORM_META[form.platform].color} bg="rgba(255,255,255,0.05)" icon={PLATFORM_META[form.platform].icon}>{PLATFORM_META[form.platform].label}</Pill>
                <Pill color={COLORS.textSecondary} bg="rgba(255,255,255,0.05)" icon={TRIGGER_META[form.trigger].icon}>{TRIGGER_META[form.trigger].label}</Pill>
                <Pill color={COLORS.textSecondary} bg="rgba(255,255,255,0.05)" icon={Users}>{form.owner}</Pill>
              </div>
            </div>
            <div className="text-[11px] uppercase" style={{ color: COLORS.textMuted }}>Sơ đồ node khởi tạo</div>
            <NodeDiagramPreview nodes={previewNodes} compact />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <button
          onClick={() => setStep(step === "trigger" ? "info" : step === "preview" ? "trigger" : onClose)}
          className="flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-md hover:bg-white/5" style={{ color: COLORS.textSecondary }}>
          {step !== "info" && <ChevronLeft size={13} />} {step === "info" ? "Huỷ" : "Quay lại"}
        </button>
        {step !== "preview" ? (
          <button disabled={!canNext} onClick={() => setStep(step === "info" ? "trigger" : "preview")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-medium transition-opacity"
            style={{ background: COLORS.lime, color: "#0A0D13", opacity: canNext ? 1 : 0.4, fontFamily: FONT_DISPLAY }}>
            Tiếp tục <ChevronRight size={13} />
          </button>
        ) : (
          <button onClick={() => { onCreate(form); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-medium" style={{ background: COLORS.lime, color: "#0A0D13", fontFamily: FONT_DISPLAY }}>
            <Check size={13} /> Tạo workflow
          </button>
        )}
      </div>
    </ModalShell>
  );
}

/* ============================================================
   IMPORT WORKFLOW MODAL
   ============================================================ */
const IMPORT_CANDIDATES = [
  { name: "Auto seeding review Shopee", platform: "shopee", nodeCount: 9 },
  { name: "Nuôi nick TikTok chuẩn hoá", platform: "tiktok", nodeCount: 14 },
  { name: "Cảnh báo tài khoản checkpoint", platform: "multi", nodeCount: 7 },
];

function ImportWorkflowModal({ onClose, onImport }) {
  const [fileName, setFileName] = useState(null);
  const [parsedList, setParsedList] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const simulateParse = (name) => {
    setFileName(name);
    setParsedList(IMPORT_CANDIDATES);
    setSelectedIdx(0);
  };

  const selected = parsedList ? parsedList[selectedIdx] : null;
  const previewNodes = useMemo(() => selected ? buildNodePreview(selected.nodeCount, selected.name) : [], [selected]);

  return (
    <ModalShell onClose={onClose} size="lg">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "rgba(78,225,240,0.12)" }}>
            <Upload size={15} style={{ color: COLORS.cyan }} />
          </div>
          <h2 className="text-[15px] font-semibold" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>Nhập workflow từ tệp</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5" style={{ color: COLORS.textMuted }}><X size={17} /></button>
      </div>

      <div className="p-5 space-y-4" style={{ fontFamily: FONT_MONO }}>
        {!parsedList ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); simulateParse(e.dataTransfer.files?.[0]?.name || "workflow-export.json"); }}
            className="flex flex-col items-center justify-center gap-3 py-14 rounded-lg cursor-pointer transition-colors"
            style={{ border: `1.5px dashed ${dragOver ? COLORS.cyan : COLORS.borderStrong}`, background: dragOver ? "rgba(78,225,240,0.04)" : "transparent" }}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".json" className="hidden" onChange={(e) => simulateParse(e.target.files?.[0]?.name || "workflow-export.json")} />
            <FileJson size={30} style={{ color: COLORS.textMuted }} />
            <div className="text-[13px]" style={{ color: COLORS.textSecondary }}>Kéo thả tệp <b style={{ color: COLORS.textPrimary }}>.json</b> vào đây</div>
            <div className="text-[11px]" style={{ color: COLORS.textMuted }}>hoặc bấm để chọn tệp từ máy tính</div>
            <button onClick={(e) => { e.stopPropagation(); simulateParse("farmrouter-export-batch.json"); }}
              className="mt-2 px-3 py-1.5 rounded-md text-[11px]" style={{ border: `1px solid ${COLORS.borderStrong}`, color: COLORS.textSecondary }}>
              Dùng tệp mẫu để thử nghiệm
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-[11.5px] px-3 py-2 rounded-md" style={{ background: "rgba(185,240,78,0.08)", color: COLORS.lime }}>
              <CheckCircle2 size={13} /> Đã đọc tệp <b>{fileName}</b> — phát hiện {parsedList.length} workflow.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                {parsedList.map((c, i) => {
                  const meta = PLATFORM_META[c.platform];
                  return (
                    <button key={i} onClick={() => setSelectedIdx(i)}
                      className="w-full text-left px-3 py-2.5 rounded-md transition-colors"
                      style={{ border: `1px solid ${selectedIdx === i ? COLORS.cyan : COLORS.border}`, background: selectedIdx === i ? "rgba(78,225,240,0.05)" : "transparent" }}>
                      <div className="text-[12px] font-medium" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>{c.name}</div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10.5px]" style={{ color: COLORS.textMuted }}>
                        <meta.icon size={11} style={{ color: meta.color }} /> {meta.label} · {c.nodeCount} node
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="sm:col-span-3">
                <div className="text-[11px] uppercase mb-1.5" style={{ color: COLORS.textMuted }}>Xem trước sơ đồ node</div>
                <NodeDiagramPreview nodes={previewNodes} compact />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <button onClick={onClose} className="text-[12px] px-3 py-1.5 rounded-md hover:bg-white/5" style={{ color: COLORS.textSecondary }}>Huỷ</button>
        <button disabled={!selected} onClick={() => { onImport(selected); onClose(); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-medium transition-opacity"
          style={{ background: COLORS.cyan, color: "#0A0D13", opacity: selected ? 1 : 0.4, fontFamily: FONT_DISPLAY }}>
          <Upload size={13} /> Nhập workflow đã chọn
        </button>
      </div>
    </ModalShell>
  );
}

/* ============================================================
   WORKFLOW DETAIL MODAL (nhiều tab con)
   ============================================================ */
function WorkflowDetailModal({ workflow, onClose }) {
  const [tab, setTab] = useState("overview");
  if (!workflow) return null;
  const w = workflow;
  const statusMeta = STATUS_META[w.status];
  const platformMeta = PLATFORM_META[w.platform];
  const PlatformIcon = platformMeta.icon;
  const TriggerIcon = TRIGGER_META[w.trigger].icon;
  const donutData = [
    { name: "Thành công", value: w.successRuns, color: COLORS.lime },
    { name: "Thất bại", value: w.failedRuns, color: COLORS.red },
  ];
  const nodeTypeCounts = useMemo(() => {
    const counts = {};
    w.nodes.forEach((n) => { counts[n.type] = (counts[n.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type, count, ...NODE_TYPE_META[type] }));
  }, [w]);

  return (
    <ModalShell onClose={onClose} size="xl">
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <StatusDot status={w.status} />
              <Pill color={statusMeta.color} bg={statusMeta.bg}>{statusMeta.label}</Pill>
              <Pill color={platformMeta.color} bg="rgba(255,255,255,0.05)" icon={PlatformIcon}>{platformMeta.label}</Pill>
              <span className="text-[11px]" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>{w.id} · {w.version}</span>
            </div>
            <h2 className="text-[17px] font-semibold" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>{w.name}</h2>
            <p className="text-[12px] mt-1 max-w-xl" style={{ color: COLORS.textSecondary }}>{w.description}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 flex-shrink-0" style={{ color: COLORS.textMuted }}><X size={18} /></button>
        </div>
      </div>

      <TabStrip
        tabs={[
          { key: "overview", label: "Tổng quan", icon: Info },
          { key: "analytics", label: "Phân tích", icon: BarChart3 },
          { key: "diagram", label: "Sơ đồ Node", icon: WorkflowIcon },
          { key: "logs", label: "Nhật ký chạy", icon: Server },
          { key: "settings", label: "Cài đặt", icon: Settings2 },
        ]}
        active={tab} onChange={setTab}
      />

      <div className="p-6" style={{ fontFamily: FONT_MONO, minHeight: 420 }}>
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: "Tổng lượt chạy", value: fmtNumber(w.totalRuns), icon: Zap, color: COLORS.amber },
                { label: "Tỉ lệ thành công", value: `${w.successRate}%`, icon: CheckCircle2, color: COLORS.lime },
                { label: "Thời gian TB", value: fmtDuration(w.avgDuration), icon: Timer, color: COLORS.cyan },
                { label: "TK đang dùng", value: fmtNumber(w.accountsInUse), icon: Users, color: COLORS.purple },
              ].map((k, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-center gap-1.5 mb-1.5"><k.icon size={12} style={{ color: k.color }} /><span className="text-[10px] uppercase" style={{ color: COLORS.textMuted }}>{k.label}</span></div>
                  <div className="text-base font-semibold" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>{k.value}</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11.5px]" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <div><span style={{ color: COLORS.textMuted }}>Kích hoạt</span><div className="flex items-center gap-1.5 mt-0.5" style={{ color: COLORS.textPrimary }}><TriggerIcon size={12} />{TRIGGER_META[w.trigger].label}</div></div>
              {w.schedule && <div><span style={{ color: COLORS.textMuted }}>Lịch chạy</span><div className="mt-0.5" style={{ color: COLORS.textPrimary }}>{w.schedule}</div></div>}
              <div><span style={{ color: COLORS.textMuted }}>Chạy gần nhất</span><div className="mt-0.5" style={{ color: COLORS.textPrimary }}>{timeAgo(w.lastRunAt)}</div></div>
              {w.nextRunAt && <div><span style={{ color: COLORS.textMuted }}>Lần chạy tới</span><div className="mt-0.5" style={{ color: COLORS.textPrimary }}>{timeUntil(w.nextRunAt)}</div></div>}
              <div><span style={{ color: COLORS.textMuted }}>Số node</span><div className="mt-0.5" style={{ color: COLORS.textPrimary }}>{w.nodeCount} node</div></div>
              <div><span style={{ color: COLORS.textMuted }}>Phụ trách</span><div className="mt-0.5" style={{ color: COLORS.textPrimary }}>{w.owner}</div></div>
              <div><span style={{ color: COLORS.textMuted }}>Ngày tạo</span><div className="mt-0.5" style={{ color: COLORS.textPrimary }}>{fmtDate(w.createdAt)}</div></div>
            </div>
            <div>
              <div className="text-[11px] uppercase mb-2" style={{ color: COLORS.textMuted }}>Thẻ gắn nhãn</div>
              <div className="flex flex-wrap gap-1.5">{w.tags.map((t) => <span key={t} className="px-2 py-0.5 rounded text-[10.5px]" style={{ background: "rgba(255,255,255,0.05)", color: COLORS.textSecondary }}>#{t}</span>)}</div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-medium hover:brightness-110" style={{ background: COLORS.lime, color: "#0A0D13" }}><Play size={12} /> Chạy ngay</button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-medium hover:bg-white/5" style={{ border: `1px solid ${COLORS.borderStrong}`, color: COLORS.textPrimary }}><ExternalLink size={12} /> Mở chỉnh sửa</button>
            </div>
          </div>
        )}

        {tab === "analytics" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div className="sm:col-span-3 rounded-lg p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <h4 className="text-[12px] font-medium mb-2 flex items-center gap-1.5" style={{ color: COLORS.textPrimary }}><Activity size={13} style={{ color: COLORS.cyan }} /> Lượt chạy 14 ngày</h4>
                <ResponsiveContainer width="100%" height={170}>
                  <AreaChart data={w.runHistory}>
                    <defs>
                      <linearGradient id="wSucc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.lime} stopOpacity={0.3} /><stop offset="100%" stopColor={COLORS.lime} stopOpacity={0} /></linearGradient>
                      <linearGradient id="wFail" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.red} stopOpacity={0.3} /><stop offset="100%" stopColor={COLORS.red} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid stroke={COLORS.border} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 9.5, fontFamily: FONT_MONO }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9.5, fontFamily: FONT_MONO }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="success" name="Thành công" stroke={COLORS.lime} fill="url(#wSucc)" strokeWidth={1.75} stackId="s" />
                    <Area type="monotone" dataKey="failed" name="Thất bại" stroke={COLORS.red} fill="url(#wFail)" strokeWidth={1.75} stackId="s" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="sm:col-span-2 rounded-lg p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <h4 className="text-[12px] font-medium mb-2 flex items-center gap-1.5" style={{ color: COLORS.textPrimary }}><Gauge size={13} style={{ color: COLORS.purple }} /> Tỉ lệ kết quả</h4>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={58} paddingAngle={3}>
                      {donutData.map((s, i) => <Cell key={i} fill={s.color} stroke={COLORS.surface} strokeWidth={2} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center -mt-2 text-[11px]" style={{ color: COLORS.textMuted }}>{w.successRate}% thành công</div>
              </div>
            </div>
            <div className="rounded-lg p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <h4 className="text-[12px] font-medium mb-2 flex items-center gap-1.5" style={{ color: COLORS.textPrimary }}><Clock size={13} style={{ color: COLORS.amber }} /> Tải chạy theo giờ trong ngày</h4>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={w.hourlyLoad}>
                  <CartesianGrid stroke={COLORS.border} vertical={false} />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} interval={2} tick={{ fill: COLORS.textMuted, fontSize: 9.5, fontFamily: FONT_MONO }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9.5, fontFamily: FONT_MONO }} axisLine={false} tickLine={false} width={26} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="runs" name="Lượt chạy" radius={[3, 3, 0, 0]}>
                    {w.hourlyLoad.map((h, i) => <Cell key={i} fill={h.runs > 60 ? COLORS.lime : h.runs > 35 ? COLORS.amber : COLORS.textMuted} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-lg p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <h4 className="text-[12px] font-medium mb-2.5 flex items-center gap-1.5" style={{ color: COLORS.textPrimary }}><Layers size={13} style={{ color: COLORS.cyan }} /> Thành phần node theo loại</h4>
              <div className="space-y-2">
                {nodeTypeCounts.map((n) => (
                  <div key={n.type} className="flex items-center gap-3">
                    <n.icon size={12} style={{ color: n.color, width: 16, flexShrink: 0 }} />
                    <span className="text-[11px] w-20 flex-shrink-0" style={{ color: COLORS.textSecondary }}>{n.label}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(n.count / w.nodes.length) * 100}%`, background: n.color }} />
                    </div>
                    <span className="text-[10.5px] w-6 text-right" style={{ color: COLORS.textMuted }}>{n.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "diagram" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px]" style={{ color: COLORS.textMuted }}>
              <span>{w.nodeCount} node · kéo ngang/dọc để xem toàn bộ sơ đồ</span>
              <span className="flex items-center gap-3 flex-wrap">
                {Object.entries(NODE_TYPE_META).map(([k, v]) => (
                  <span key={k} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: v.color }} />{v.label}</span>
                ))}
              </span>
            </div>
            <NodeDiagramPreview nodes={w.nodes} />
          </div>
        )}

        {tab === "logs" && (
          <div className="rounded-lg overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <h4 className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: COLORS.textPrimary }}><Server size={13} style={{ color: COLORS.amber }} /> Nhật ký chạy gần đây</h4>
              <span className="text-[10.5px]" style={{ color: COLORS.textMuted }}>{w.runLog.length} bản ghi</span>
            </div>
            {w.runLog.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12px]" style={{ color: COLORS.textMuted }}>Chưa có lượt chạy nào — workflow đang ở trạng thái nháp.</div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {w.runLog.map((log) => (
                  <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 text-[11.5px]" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    {log.status === "success" ? <CheckCircle2 size={13} style={{ color: COLORS.lime, flexShrink: 0 }} /> : <XCircle size={13} style={{ color: COLORS.red, flexShrink: 0 }} />}
                    <span style={{ color: COLORS.textMuted, width: 78, flexShrink: 0 }}>{timeAgo(log.time)}</span>
                    <span style={{ color: COLORS.textSecondary, width: 60, flexShrink: 0 }}>{fmtDuration(log.duration)}</span>
                    <span style={{ color: COLORS.textSecondary, width: 90, flexShrink: 0 }}>{log.accountsUsed} tài khoản</span>
                    {log.error && <span className="truncate" style={{ color: COLORS.red }}>{log.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="space-y-4">
            <div className="rounded-lg p-4 space-y-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <h4 className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: COLORS.textPrimary }}><Settings2 size={13} style={{ color: COLORS.cyan }} /> Cấu hình chạy</h4>
              <div className="grid grid-cols-2 gap-3 text-[11.5px]">
                <div><span style={{ color: COLORS.textMuted }}>Số luồng song song</span><div className="mt-0.5" style={{ color: COLORS.textPrimary }}>{w.concurrency} luồng</div></div>
                <div><span style={{ color: COLORS.textMuted }}>Chính sách thử lại</span><div className="mt-0.5" style={{ color: COLORS.textPrimary }}>{w.retryPolicy}</div></div>
              </div>
              <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-1.5 text-[11.5px]" style={{ color: COLORS.textSecondary }}><Bell size={12} /> Thông báo khi lỗi</div>
                <span className="text-[11px] px-2 py-0.5 rounded" style={{ color: w.notifyOnError ? COLORS.lime : COLORS.textMuted, background: w.notifyOnError ? "rgba(185,240,78,0.1)" : "rgba(255,255,255,0.04)" }}>{w.notifyOnError ? "Đang bật" : "Đang tắt"}</span>
              </div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "rgba(240,87,78,0.05)", border: `1px solid rgba(240,87,78,0.25)` }}>
              <h4 className="text-[12px] font-medium flex items-center gap-1.5 mb-2" style={{ color: COLORS.red }}><ShieldAlert size={13} /> Khu vực nguy hiểm</h4>
              <p className="text-[11px] mb-3" style={{ color: COLORS.textSecondary }}>Lưu trữ hoặc xoá workflow sẽ dừng toàn bộ lượt chạy đang lên lịch.</p>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px]" style={{ border: `1px solid ${COLORS.borderStrong}`, color: COLORS.textSecondary }}><Archive size={12} /> Lưu trữ</button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px]" style={{ border: `1px solid rgba(240,87,78,0.4)`, color: COLORS.red }}><Trash2 size={12} /> Xoá workflow</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* ============================================================
   ROW MENU
   ============================================================ */
function RowMenu({ onClose, workflow }) {
  const items = [
    { icon: ExternalLink, label: "Mở chỉnh sửa" },
    { icon: workflow.status === "active" ? Pause : Play, label: workflow.status === "active" ? "Tạm dừng" : "Kích hoạt" },
    { icon: Copy, label: "Nhân bản" },
    { icon: RefreshCw, label: "Chạy thử ngay" },
    { icon: Archive, label: "Lưu trữ" },
    { icon: Trash2, label: "Xoá workflow", danger: true },
  ];
  return (
    <div className="absolute right-0 top-8 z-20 w-48 rounded-md py-1 shadow-2xl" style={{ background: "#0D1017", border: `1px solid ${COLORS.borderStrong}` }} onMouseLeave={onClose}>
      {items.map((it, i) => (
        <button key={i} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/5 transition-colors" style={{ color: it.danger ? COLORS.red : COLORS.textSecondary, fontFamily: FONT_MONO }}>
          <it.icon size={13} /> {it.label}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   TABLE VIEW
   ============================================================ */
function TableView({ workflows, onSelect, sortKey, sortDir, onSort }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const Header = ({ label, sk, width }) => (
    <th className="text-left px-3 py-2.5 cursor-pointer select-none whitespace-nowrap" style={{ width, color: COLORS.textMuted, fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: "0.04em" }} onClick={() => sk && onSort(sk)}>
      <div className="flex items-center gap-1 uppercase">{label}{sk && <ArrowUpDown size={10} style={{ opacity: sortKey === sk ? 1 : 0.3, color: sortKey === sk ? COLORS.cyan : undefined }} />}</div>
    </th>
  );
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead><tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <Header label="Workflow" sk="name" width="26%" />
            <Header label="Trạng thái" sk="status" width="9%" />
            <Header label="Nền tảng" sk="platform" width="9%" />
            <Header label="Node" sk="nodeCount" width="6%" />
            <Header label="Lượt chạy" sk="totalRuns" width="9%" />
            <Header label="Tỉ lệ TC" sk="successRate" width="10%" />
            <Header label="TG chạy TB" sk="avgDuration" width="9%" />
            <Header label="Chạy gần nhất" sk="lastRunAt" width="10%" />
            <Header label="Phụ trách" sk="owner" width="8%" />
            <th style={{ width: "4%" }} />
          </tr></thead>
          <tbody>
            {workflows.map((w) => {
              const statusMeta = STATUS_META[w.status];
              const platformMeta = PLATFORM_META[w.platform];
              const PlatformIcon = platformMeta.icon;
              return (
                <tr key={w.id} className="cursor-pointer transition-colors hover:bg-white/[0.03] group" style={{ borderBottom: `1px solid ${COLORS.border}` }} onClick={() => onSelect(w)}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <StatusDot status={w.status} />
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium truncate" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY, maxWidth: 240 }}>{w.name}</div>
                        <div className="text-[10.5px] truncate" style={{ color: COLORS.textMuted, maxWidth: 240 }}>{w.id} · {w.version}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><Pill color={statusMeta.color} bg={statusMeta.bg}>{statusMeta.label}</Pill></td>
                  <td className="px-3 py-2.5"><span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}><PlatformIcon size={12} style={{ color: platformMeta.color }} />{platformMeta.label}</span></td>
                  <td className="px-3 py-2.5 text-[11.5px]" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>{w.nodeCount}</td>
                  <td className="px-3 py-2.5 text-[11.5px]" style={{ color: COLORS.textPrimary, fontFamily: FONT_MONO }}>{fmtNumber(w.totalRuns)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full" style={{ width: `${w.successRate}%`, background: w.successRate > 90 ? COLORS.lime : w.successRate > 70 ? COLORS.amber : COLORS.red }} />
                      </div>
                      <span className="text-[11px]" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>{w.successRate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px]" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>{fmtDuration(w.avgDuration)}</td>
                  <td className="px-3 py-2.5 text-[11.5px]" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>{timeAgo(w.lastRunAt)}</td>
                  <td className="px-3 py-2.5"><span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px]" style={{ background: "rgba(78,225,240,0.15)", color: COLORS.cyan }}>{initials(w.owner)}</span></td>
                  <td className="px-3 py-2.5 relative" onClick={(e) => e.stopPropagation()}>
                    <button className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10" style={{ color: COLORS.textMuted }} onClick={() => setOpenMenuId(openMenuId === w.id ? null : w.id)}><MoreVertical size={14} /></button>
                    {openMenuId === w.id && <RowMenu workflow={w} onClose={() => setOpenMenuId(null)} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {workflows.length === 0 && <div className="py-14 text-center text-[12.5px]" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>Không tìm thấy workflow phù hợp với bộ lọc hiện tại.</div>}
    </div>
  );
}

/* ============================================================
   GRID VIEW — lưới thật, CSS grid tường minh (không phụ thuộc breakpoint Tailwind)
   ============================================================ */
function GridView({ workflows, onSelect }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  if (workflows.length === 0) {
    return <div className="py-14 text-center rounded-lg text-[12.5px]" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontFamily: FONT_MONO }}>Không tìm thấy workflow phù hợp với bộ lọc hiện tại.</div>;
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
      {workflows.map((w) => {
        const statusMeta = STATUS_META[w.status];
        const platformMeta = PLATFORM_META[w.platform];
        const PlatformIcon = platformMeta.icon;
        const sparkColor = w.status === "error" ? COLORS.red : w.successRate > 90 ? COLORS.lime : COLORS.amber;
        return (
          <div key={w.id} className="relative rounded-lg p-4 cursor-pointer transition-all hover:border-white/20 hover:-translate-y-0.5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }} onClick={() => onSelect(w)}>
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-2 min-w-0"><StatusDot status={w.status} /><span className="text-[13px] font-medium truncate" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>{w.name}</span></div>
              <button className="p-1 rounded hover:bg-white/10 flex-shrink-0" style={{ color: COLORS.textMuted }} onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === w.id ? null : w.id); }}><MoreVertical size={14} /></button>
              {openMenuId === w.id && <RowMenu workflow={w} onClose={() => setOpenMenuId(null)} />}
            </div>
            <p className="text-[11px] mb-3 line-clamp-2" style={{ color: COLORS.textMuted }}>{w.description}</p>
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              <Pill color={statusMeta.color} bg={statusMeta.bg}>{statusMeta.label}</Pill>
              <Pill color={platformMeta.color} bg="rgba(255,255,255,0.05)" icon={PlatformIcon}>{platformMeta.label}</Pill>
              <Pill color={COLORS.textSecondary} bg="rgba(255,255,255,0.05)" icon={GitBranch}>{w.nodeCount} node</Pill>
            </div>
            <div className="mb-2"><Sparkline data={w.runHistory} color={sparkColor} /></div>
            <div className="grid grid-cols-3 gap-2 pt-2.5" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <div><div className="text-[9.5px] uppercase" style={{ color: COLORS.textMuted }}>Lượt chạy</div><div className="text-[12.5px] font-medium" style={{ color: COLORS.textPrimary, fontFamily: FONT_MONO }}>{fmtNumber(w.totalRuns)}</div></div>
              <div><div className="text-[9.5px] uppercase" style={{ color: COLORS.textMuted }}>Tỉ lệ TC</div><div className="text-[12.5px] font-medium" style={{ color: w.successRate > 90 ? COLORS.lime : w.successRate > 70 ? COLORS.amber : COLORS.red, fontFamily: FONT_MONO }}>{w.successRate}%</div></div>
              <div><div className="text-[9.5px] uppercase" style={{ color: COLORS.textMuted }}>Gần nhất</div><div className="text-[11.5px] font-medium truncate" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>{timeAgo(w.lastRunAt)}</div></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   FILTER DROPDOWN
   ============================================================ */
function FilterDropdown({ label, options, value, onChange, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] transition-colors hover:bg-white/5" style={{ border: `1px solid ${COLORS.border}`, color: value !== "all" ? COLORS.cyan : COLORS.textSecondary, fontFamily: FONT_MONO }}>
        {Icon && <Icon size={12} />}{label}: {current?.label ?? "Tất cả"}<ChevronDown size={11} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-20 w-44 rounded-md py-1 shadow-2xl" style={{ background: "#0D1017", border: `1px solid ${COLORS.borderStrong}` }} onMouseLeave={() => setOpen(false)}>
          {options.map((o) => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-[11.5px] hover:bg-white/5 transition-colors flex items-center justify-between" style={{ color: value === o.value ? COLORS.cyan : COLORS.textSecondary, fontFamily: FONT_MONO }}>
              {o.label} {value === o.value && <CheckCircle2 size={11} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   OVERALL ANALYTICS (nâng cấp)
   ============================================================ */
const RANK_META = [
  { color: COLORS.amber, icon: Crown },
  { color: COLORS.cyan, icon: Award },
  { color: COLORS.purple, icon: Medal },
];

function OverallAnalytics({ workflows }) {
  const totalRuns = workflows.reduce((s, w) => s + w.totalRuns, 0);
  const totalSuccess = workflows.reduce((s, w) => s + w.successRuns, 0);
  const overallSuccessRate = totalRuns ? ((totalSuccess / totalRuns) * 100).toFixed(1) : "0";
  const activeCount = workflows.filter((w) => w.status === "active").length;
  const errorCount = workflows.filter((w) => w.status === "error").length;
  const totalAccounts = workflows.reduce((s, w) => s + w.accountsInUse, 0);

  const trend = useMemo(() => {
    const days = 14;
    return Array.from({ length: days }, (_, i) => {
      const label = workflows[0]?.runHistory[i]?.date ?? "";
      let runs = 0, success = 0, failed = 0;
      workflows.forEach((w) => { const d = w.runHistory[i]; if (d) { runs += d.runs; success += d.success; failed += d.failed; } });
      return { date: label, runs, success, failed };
    });
  }, [workflows]);

  const statusDist = useMemo(() => {
    const counts = {};
    workflows.forEach((w) => { counts[w.status] = (counts[w.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ name: STATUS_META[status].label, value: count, color: STATUS_META[status].color, pct: Math.round((count / workflows.length) * 100) }));
  }, [workflows]);

  const platformDist = useMemo(() => {
    const agg = {};
    workflows.forEach((w) => {
      agg[w.platform] = agg[w.platform] || { count: 0, success: 0, failed: 0 };
      agg[w.platform].count += 1; agg[w.platform].success += w.successRuns; agg[w.platform].failed += w.failedRuns;
    });
    return Object.entries(agg).map(([p, v]) => ({ name: PLATFORM_META[p].label, icon: PLATFORM_META[p].icon, color: PLATFORM_META[p].color, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [workflows]);

  const topByRuns = useMemo(() => [...workflows].sort((a, b) => b.totalRuns - a.totalRuns).slice(0, 6), [workflows]);

  const hourlyTotal = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => ({ hour: h, runs: workflows.reduce((s, w) => s + (w.hourlyLoad[h]?.runs || 0), 0) }));
  }, [workflows]);

  const topErrors = useMemo(() => {
    const counts = {};
    workflows.forEach((w) => w.runLog.forEach((l) => { if (l.error) counts[l.error] = (counts[l.error] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([msg, count]) => ({ msg, count }));
  }, [workflows]);

  const ownerPerf = useMemo(() => {
    const agg = {};
    workflows.forEach((w) => {
      agg[w.owner] = agg[w.owner] || { runs: 0, success: 0, count: 0 };
      agg[w.owner].runs += w.totalRuns; agg[w.owner].success += w.successRuns; agg[w.owner].count += 1;
    });
    return Object.entries(agg).map(([owner, v]) => ({ owner, ...v, rate: v.runs ? Math.round((v.success / v.runs) * 1000) / 10 : 0 })).sort((a, b) => b.runs - a.runs);
  }, [workflows]);

  const maxHourly = Math.max(...hourlyTotal.map((h) => h.runs), 1);
  const maxPlatform = Math.max(...platformDist.map((p) => p.count), 1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Tổng workflow" value={workflows.length} icon={GitBranch} accent={COLORS.cyan} />
        <KpiCard label="Đang chạy" value={activeCount} delta="+2" deltaGood icon={Activity} accent={COLORS.lime} />
        <KpiCard label="Tổng lượt chạy" value={fmtNumber(totalRuns)} delta="+12.4%" deltaGood icon={Zap} accent={COLORS.amber} />
        <KpiCard label="Tỉ lệ thành công" value={`${overallSuccessRate}%`} delta="+0.8%" deltaGood icon={CheckCircle2} accent={COLORS.lime} />
        <KpiCard label="Workflow lỗi" value={errorCount} delta="-1" deltaGood icon={AlertTriangle} accent={COLORS.red} />
        <KpiCard label="Tài khoản đang dùng" value={fmtNumber(totalAccounts)} icon={Users} accent={COLORS.purple} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-lg p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}><BarChart3 size={15} style={{ color: COLORS.cyan }} /> Lượt chạy 14 ngày gần đây</h3>
            <div className="flex items-center gap-3 text-[11px]" style={{ fontFamily: FONT_MONO, color: COLORS.textMuted }}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.lime }} />Thành công</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.red }} />Thất bại</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="ovSuccess" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.lime} stopOpacity={0.3} /><stop offset="100%" stopColor={COLORS.lime} stopOpacity={0} /></linearGradient>
                <linearGradient id="ovFailed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.red} stopOpacity={0.3} /><stop offset="100%" stopColor={COLORS.red} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 10, fontFamily: FONT_MONO }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10, fontFamily: FONT_MONO }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="success" name="Thành công" stroke={COLORS.lime} fill="url(#ovSuccess)" strokeWidth={2} stackId="1" />
              <Area type="monotone" dataKey="failed" name="Thất bại" stroke={COLORS.red} fill="url(#ovFailed)" strokeWidth={2} stackId="1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg p-4 flex flex-col" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}><PieChartIcon size={15} style={{ color: COLORS.purple }} /> Phân bố trạng thái</h3>
          <div className="relative flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={175}>
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={4}>
                  {statusDist.map((s, i) => <Cell key={i} fill={s.color} stroke={COLORS.surface} strokeWidth={2} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-xl font-semibold" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>{workflows.length}</span>
              <span className="text-[9.5px] uppercase" style={{ color: COLORS.textMuted }}>workflow</span>
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            {statusDist.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]" style={{ fontFamily: FONT_MONO }}>
                <span className="flex items-center gap-1.5" style={{ color: COLORS.textSecondary }}><span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.name}</span>
                <span style={{ color: COLORS.textPrimary }}>{s.value} <span style={{ color: COLORS.textMuted }}>({s.pct}%)</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-lg p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3.5" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}><TrendingUp size={15} style={{ color: COLORS.amber }} /> Top workflow theo lượt chạy</h3>
          <div className="space-y-2.5">
            {topByRuns.map((w, i) => {
              const rank = RANK_META[i] || { color: COLORS.textMuted, icon: Hash };
              const pct = Math.round((w.totalRuns / topByRuns[0].totalRuns) * 100);
              return (
                <div key={w.id} className="flex items-center gap-2.5">
                  <rank.icon size={13} style={{ color: rank.color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11.5px] truncate" style={{ color: COLORS.textPrimary, maxWidth: 200 }}>{w.name}</span>
                      <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>{fmtNumber(w.totalRuns)} <span style={{ color: w.successRate > 90 ? COLORS.lime : COLORS.amber }}>· {w.successRate}%</span></span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: rank.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3.5" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}><Layers size={15} style={{ color: COLORS.cyan }} /> Workflow &amp; lượt chạy theo nền tảng</h3>
          <div className="space-y-3">
            {platformDist.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: COLORS.textPrimary }}><p.icon size={12} style={{ color: p.color }} />{p.name}</span>
                  <span className="text-[10.5px]" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>{p.count} workflow · {fmtNumber(p.success + p.failed)} lượt chạy</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full" style={{ width: `${(p.count / maxPlatform) * 100}%`, background: p.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-lg p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}><Clock size={15} style={{ color: COLORS.amber }} /> Giờ cao điểm chạy workflow (toàn hệ thống)</h3>
          <div className="flex items-end gap-[3px]" style={{ height: 90 }}>
            {hourlyTotal.map((h) => (
              <div key={h.hour} className="flex-1 rounded-t-sm transition-all" title={`${h.hour}h — ${h.runs} lượt`} style={{ height: `${Math.max(6, (h.runs / maxHourly) * 100)}%`, background: h.runs / maxHourly > 0.75 ? COLORS.lime : h.runs / maxHourly > 0.4 ? COLORS.amber : "rgba(255,255,255,0.12)" }} />
            ))}
          </div>
          <div className="flex justify-between mt-1.5 text-[9px]" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
            <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}><AlertOctagon size={15} style={{ color: COLORS.red }} /> Lỗi thường gặp</h3>
          {topErrors.length === 0 ? (
            <div className="text-[11.5px] py-6 text-center" style={{ color: COLORS.textMuted }}>Không có lỗi đáng chú ý.</div>
          ) : (
            <div className="space-y-2">
              {topErrors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <span className="mt-0.5 px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(240,87,78,0.12)", color: COLORS.red, fontFamily: FONT_MONO }}>{e.count}×</span>
                  <span style={{ color: COLORS.textSecondary }}>{e.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}><Users size={15} style={{ color: COLORS.purple }} /> Hiệu suất theo người phụ trách</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {["Phụ trách", "Số workflow", "Tổng lượt chạy", "Tỉ lệ thành công"].map((h) => <th key={h} className="text-left px-4 py-2 text-[10px] uppercase" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {ownerPerf.map((o) => (
                <tr key={o.owner} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="px-4 py-2.5 text-[11.5px] flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px]" style={{ background: "rgba(78,225,240,0.15)", color: COLORS.cyan }}>{initials(o.owner)}</span>{o.owner}
                  </td>
                  <td className="px-4 py-2.5 text-[11.5px]" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>{o.count}</td>
                  <td className="px-4 py-2.5 text-[11.5px]" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>{fmtNumber(o.runs)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}><div className="h-full rounded-full" style={{ width: `${o.rate}%`, background: o.rate > 90 ? COLORS.lime : COLORS.amber }} /></div>
                      <span className="text-[11px]" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>{o.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TAB: LỊCH CHẠY
   ============================================================ */
function ScheduleTab({ workflows, onSelect }) {
  const upcoming = useMemo(() => workflows.filter((w) => w.nextRunAt).sort((a, b) => a.nextRunAt - b.nextRunAt), [workflows]);
  const scheduled = useMemo(() => workflows.filter((w) => w.trigger === "schedule"), [workflows]);
  const groupLabel = (d) => {
    const diffH = (d - Date.now()) / 3600000;
    if (diffH < 1) return "Trong 1 giờ tới";
    if (diffH < 6) return "Trong 6 giờ tới";
    if (diffH < 24) return "Hôm nay";
    return "Sắp tới";
  };
  const groups = {};
  upcoming.forEach((w) => { const g = groupLabel(w.nextRunAt); groups[g] = groups[g] || []; groups[g].push(w); });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 rounded-lg p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <h3 className="text-sm font-medium flex items-center gap-2 mb-4" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}><CalendarClock size={15} style={{ color: COLORS.cyan }} /> Lịch chạy sắp tới</h3>
        {Object.keys(groups).length === 0 ? (
          <div className="py-10 text-center text-[12px]" style={{ color: COLORS.textMuted }}>Không có workflow nào đang chờ lịch chạy.</div>
        ) : (
          <div className="space-y-5">
            {Object.entries(groups).map(([g, list]) => (
              <div key={g}>
                <div className="text-[10.5px] uppercase mb-2" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>{g}</div>
                <div className="space-y-2">
                  {list.map((w) => {
                    const platformMeta = PLATFORM_META[w.platform];
                    return (
                      <div key={w.id} onClick={() => onSelect(w)} className="flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-white/[0.03]" style={{ border: `1px solid ${COLORS.border}` }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "rgba(78,225,240,0.1)" }}><platformMeta.icon size={14} style={{ color: platformMeta.color }} /></div>
                          <div className="min-w-0"><div className="text-[12px] font-medium truncate" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY, maxWidth: 260 }}>{w.name}</div><div className="text-[10.5px]" style={{ color: COLORS.textMuted }}>{w.schedule}</div></div>
                        </div>
                        <Pill color={COLORS.cyan} bg="rgba(78,225,240,0.1)" icon={Clock}>{timeUntil(w.nextRunAt)}</Pill>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <h3 className="text-sm font-medium flex items-center gap-2 mb-4" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}><Calendar size={15} style={{ color: COLORS.purple }} /> Tổng số theo tần suất</h3>
        <div className="space-y-2.5">
          {Object.entries(scheduled.reduce((acc, w) => { acc[w.schedule] = (acc[w.schedule] || 0) + 1; return acc; }, {})).map(([s, count]) => (
            <div key={s} className="flex items-center justify-between text-[11.5px] px-3 py-2 rounded-md" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span style={{ color: COLORS.textSecondary }}>{s}</span>
              <span style={{ color: COLORS.textPrimary, fontFamily: FONT_MONO }}>{count} workflow</span>
            </div>
          ))}
          {scheduled.length === 0 && <div className="text-[11.5px] text-center py-6" style={{ color: COLORS.textMuted }}>Chưa có workflow nào dùng lịch chạy.</div>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TAB: NHẬT KÝ & CẢNH BÁO
   ============================================================ */
function LogsAlertsTab({ workflows, onSelect }) {
  const [filter, setFilter] = useState("all");
  const allLogs = useMemo(() => {
    const merged = [];
    workflows.forEach((w) => w.runLog.forEach((l) => merged.push({ ...l, workflowId: w.id, workflowRef: w })));
    return merged.sort((a, b) => b.time - a.time).slice(0, 60);
  }, [workflows]);
  const filteredLogs = allLogs.filter((l) => filter === "all" || l.status === filter);
  const alerts = useMemo(() => workflows.filter((w) => w.status === "error" || w.errorCount24h > 15).sort((a, b) => b.errorCount24h - a.errorCount24h), [workflows]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="rounded-lg p-4 xl:col-span-1" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <h3 className="text-sm font-medium flex items-center gap-2 mb-3" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}><ShieldAlert size={15} style={{ color: COLORS.red }} /> Cảnh báo cần chú ý</h3>
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-[12px]" style={{ color: COLORS.textMuted }}>Không có cảnh báo nào — hệ thống ổn định.</div>
        ) : (
          <div className="space-y-2">
            {alerts.map((w) => (
              <div key={w.id} onClick={() => onSelect(w)} className="p-3 rounded-md cursor-pointer transition-colors hover:bg-white/[0.03]" style={{ border: `1px solid rgba(240,87,78,0.3)`, background: "rgba(240,87,78,0.04)" }}>
                <div className="flex items-center gap-1.5 mb-1"><AlertTriangle size={12} style={{ color: COLORS.red }} /><span className="text-[12px] font-medium truncate" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>{w.name}</span></div>
                <div className="text-[10.5px]" style={{ color: COLORS.textSecondary }}>{w.errorCount24h} lỗi trong 24h qua · {w.owner}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg overflow-hidden xl:col-span-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}><Server size={15} style={{ color: COLORS.amber }} /> Nhật ký chạy toàn hệ thống</h3>
          <div className="flex items-center gap-1">
            {[{ k: "all", l: "Tất cả" }, { k: "success", l: "Thành công" }, { k: "failed", l: "Thất bại" }].map((f) => (
              <button key={f.k} onClick={() => setFilter(f.k)} className="px-2.5 py-1 rounded text-[10.5px]" style={{ background: filter === f.k ? COLORS.surface3 : "transparent", color: filter === f.k ? COLORS.textPrimary : COLORS.textMuted, border: `1px solid ${filter === f.k ? COLORS.borderStrong : "transparent"}` }}>{f.l}</button>
            ))}
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {filteredLogs.map((log) => (
            <div key={log.id} onClick={() => onSelect(log.workflowRef)} className="px-4 py-2.5 flex items-center gap-3 text-[11.5px] cursor-pointer hover:bg-white/[0.03]" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {log.status === "success" ? <CheckCircle2 size={13} style={{ color: COLORS.lime, flexShrink: 0 }} /> : <XCircle size={13} style={{ color: COLORS.red, flexShrink: 0 }} />}
              <span className="truncate flex-1" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY, maxWidth: 220 }}>{log.workflowName}</span>
              <span style={{ color: COLORS.textMuted, width: 78, flexShrink: 0 }}>{timeAgo(log.time)}</span>
              <span style={{ color: COLORS.textSecondary, width: 55, flexShrink: 0 }}>{fmtDuration(log.duration)}</span>
              {log.error && <span className="truncate hidden sm:inline" style={{ color: COLORS.red }}>{log.error}</span>}
            </div>
          ))}
          {filteredLogs.length === 0 && <div className="py-10 text-center text-[12px]" style={{ color: COLORS.textMuted }}>Không có bản ghi phù hợp.</div>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function WorkflowManager() {
  const [extraWorkflows, setExtraWorkflows] = useState([]);
  const workflows = useMemo(() => [...extraWorkflows, ...BASE_WORKFLOWS], [extraWorkflows]);

  const [tab, setTab] = useState("list");
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [sortKey, setSortKey] = useState("totalRuns");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleSort = useCallback((key) => {
    setSortKey((prevKey) => {
      if (prevKey === key) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); return key; }
      setSortDir("desc");
      return key;
    });
  }, []);

  const handleCreateWorkflow = useCallback((form) => {
    const nodeCount = form.startTemplate === "blank" ? 2 : form.startTemplate === "basic" ? 6 : 12;
    const newWf = {
      id: `wf-new-${Date.now()}`,
      name: form.name || "Workflow chưa đặt tên",
      description: form.description || "Chưa có mô tả.",
      status: "draft",
      platform: form.platform,
      trigger: form.trigger,
      schedule: form.trigger === "schedule" ? form.schedule : null,
      nodeCount,
      totalRuns: 0, successRuns: 0, failedRuns: 0, successRate: 0, avgDuration: 0,
      accountsInUse: 0, errorCount24h: 0,
      lastRunAt: null, lastRunStatus: null, nextRunAt: null,
      createdAt: new Date(), updatedAt: new Date(),
      owner: form.owner, tags: form.tags, version: "v1.0.0",
      runHistory: genRunHistory(14, 0), runLog: [],
      hourlyLoad: Array.from({ length: 24 }, (_, h) => ({ hour: h, runs: 0 })),
      nodes: buildNodePreview(nodeCount, form.name || "workflow-moi"),
      concurrency: 1, retryPolicy: "Không thử lại", notifyOnError: true,
    };
    setExtraWorkflows((prev) => [newWf, ...prev]);
  }, []);

  const handleImportWorkflow = useCallback((candidate) => {
    const newWf = {
      id: `wf-import-${Date.now()}`,
      name: candidate.name,
      description: "Workflow được nhập từ tệp cấu hình bên ngoài.",
      status: "paused",
      platform: candidate.platform,
      trigger: "manual",
      schedule: null,
      nodeCount: candidate.nodeCount,
      totalRuns: 0, successRuns: 0, failedRuns: 0, successRate: 0, avgDuration: randInt(10, 60),
      accountsInUse: randInt(5, 30), errorCount24h: 0,
      lastRunAt: null, lastRunStatus: null, nextRunAt: null,
      createdAt: new Date(), updatedAt: new Date(),
      owner: OWNERS[0], tags: ["nhập từ tệp"], version: "v1.0.0",
      runHistory: genRunHistory(14, 0), runLog: [],
      hourlyLoad: Array.from({ length: 24 }, (_, h) => ({ hour: h, runs: 0 })),
      nodes: buildNodePreview(candidate.nodeCount, candidate.name),
      concurrency: 1, retryPolicy: "Thử lại tối đa 2 lần", notifyOnError: false,
    };
    setExtraWorkflows((prev) => [newWf, ...prev]);
  }, []);

  const filtered = useMemo(() => {
    let list = workflows.filter((w) => {
      if (search && !`${w.name} ${w.description} ${w.owner}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      if (platformFilter !== "all" && w.platform !== platformFilter) return false;
      if (triggerFilter !== "all" && w.trigger !== triggerFilter) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (av instanceof Date) av = av.getTime();
      if (bv instanceof Date) bv = bv.getTime();
      if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av == null) av = -Infinity;
      if (bv == null) bv = -Infinity;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [workflows, search, statusFilter, platformFilter, triggerFilter, sortKey, sortDir]);

  const activeFilterCount = [statusFilter, platformFilter, triggerFilter].filter((f) => f !== "all").length;

  const TABS = [
    { key: "list", label: "Danh sách Workflow", icon: List },
    { key: "analytics", label: "Analytics tổng quan", icon: BarChart3 },
    { key: "schedule", label: "Lịch chạy", icon: CalendarClock },
    { key: "logs", label: "Nhật ký & Cảnh báo", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen w-full" style={{ background: COLORS.bg, fontFamily: FONT_MONO }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        select option { background: #10141B; }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-5 py-6">
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "rgba(185,240,78,0.12)" }}><GitBranch size={15} style={{ color: COLORS.lime }} /></div>
              <span className="text-[11px] uppercase tracking-widest" style={{ color: COLORS.textMuted }}>FarmRouter / Module</span>
            </div>
            <h1 className="text-2xl font-semibold" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>Quản lý Workflow</h1>
            <p className="text-[12px] mt-1" style={{ color: COLORS.textSecondary }}>{workflows.length} kịch bản tự động hoá · {workflows.filter((w) => w.status === "active").length} đang chạy trực tiếp</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-md text-[12.5px] font-medium transition-colors hover:bg-white/5" style={{ border: `1px solid ${COLORS.borderStrong}`, color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }}>
              <Upload size={15} /> Nhập workflow
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-md text-[12.5px] font-medium transition-transform hover:scale-[1.02]" style={{ background: COLORS.lime, color: "#0A0D13", fontFamily: FONT_DISPLAY }}>
              <Plus size={15} /> Tạo workflow mới
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-5 p-1 rounded-lg w-fit flex-wrap" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12px] font-medium transition-colors" style={{ background: tab === t.key ? COLORS.surface2 : "transparent", color: tab === t.key ? COLORS.textPrimary : COLORS.textMuted, border: tab === t.key ? `1px solid ${COLORS.borderStrong}` : "1px solid transparent" }}>
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {tab === "analytics" && <OverallAnalytics workflows={workflows} />}
        {tab === "schedule" && <ScheduleTab workflows={workflows} onSelect={setSelected} />}
        {tab === "logs" && <LogsAlertsTab workflows={workflows} onSelect={setSelected} />}

        {tab === "list" && (
          <>
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm workflow, mô tả, người phụ trách..." className="pl-8 pr-3 py-1.5 rounded-md text-[12px] outline-none w-64" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontFamily: FONT_MONO }} />
                </div>
                <FilterDropdown label="Trạng thái" icon={Filter} value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "Tất cả" }, ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))]} />
                <FilterDropdown label="Nền tảng" value={platformFilter} onChange={setPlatformFilter} options={[{ value: "all", label: "Tất cả" }, ...Object.entries(PLATFORM_META).map(([k, v]) => ({ value: k, label: v.label }))]} />
                <FilterDropdown label="Kích hoạt" value={triggerFilter} onChange={setTriggerFilter} options={[{ value: "all", label: "Tất cả" }, ...Object.entries(TRIGGER_META).map(([k, v]) => ({ value: k, label: v.label }))]} />
                {activeFilterCount > 0 && (
                  <button onClick={() => { setStatusFilter("all"); setPlatformFilter("all"); setTriggerFilter("all"); }} className="flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-md hover:bg-white/5" style={{ color: COLORS.textMuted }}>
                    <X size={11} /> Xoá lọc ({activeFilterCount})
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 p-1 rounded-md flex-shrink-0" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <button onClick={() => setView("table")} className="p-1.5 rounded transition-colors" style={{ background: view === "table" ? COLORS.surface2 : "transparent", color: view === "table" ? COLORS.cyan : COLORS.textMuted }} title="Xem dạng bảng"><List size={15} /></button>
                <button onClick={() => setView("grid")} className="p-1.5 rounded transition-colors" style={{ background: view === "grid" ? COLORS.surface2 : "transparent", color: view === "grid" ? COLORS.cyan : COLORS.textMuted }} title="Xem dạng lưới"><LayoutGrid size={15} /></button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 text-[11px]" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
              <span>Hiển thị {filtered.length} / {workflows.length} workflow</span>
            </div>

            {view === "table" ? <TableView workflows={filtered} onSelect={setSelected} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} /> : <GridView workflows={filtered} onSelect={setSelected} />}
          </>
        )}
      </div>

      {selected && <WorkflowDetailModal workflow={selected} onClose={() => setSelected(null)} />}
      {showCreate && <CreateWorkflowModal onClose={() => setShowCreate(false)} onCreate={handleCreateWorkflow} />}
      {showImport && <ImportWorkflowModal onClose={() => setShowImport(false)} onImport={handleImportWorkflow} />}
    </div>
  );
}