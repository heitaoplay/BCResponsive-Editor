import type { ResponseTrigger, ResponseTriggerMode } from "../types";

export const MODE_META: Record<ResponseTriggerMode, { icon: string; label: string }> = {
  activity: { icon: "🎯", label: "互动活动" },
  orgasm: { icon: "💥", label: "高潮" },
  spicer: { icon: "🔥", label: "兴奋度" },
  event: { icon: "🔔", label: "进出聊天" },
};

// 折叠态一行摘要：模式图标 + 触发条件，让用户不展开也知道这条响应会做什么。
export function summarizeTrigger(t: ResponseTrigger): string {
  if (t.mode === "activity") {
    const a = t.allow_activities;
    let s: string;
    if (a === undefined || a === null) s = "全部活动";
    else if (a.length === 0) s = "无活动（不触发）";
    else s = a.slice(0, 3).join(", ") + (a.length > 3 ? ` +${a.length - 3}` : "");
    const b = t.allow_bodyparts;
    if (b && b.length > 0) {
      s += ` · 部位 ${b.slice(0, 2).join("/")}${b.length > 2 ? ` +${b.length - 2}` : ""}`;
    }
    return s;
  }
  if (t.mode === "orgasm") {
    const map: Record<string, string> = {
      Any: "任意",
      Orgasmed: "达到高潮",
      Ruined: "破坏高潮",
      Resisted: "忍住",
    };
    return `高潮 · ${map[t.type] ?? t.type}`;
  }
  if (t.mode === "spicer") {
    const lo = t.min_arousal ?? 0;
    const hi = t.max_arousal ?? 100;
    return `兴奋度 ${lo}–${hi}${t.apply_favorite ? " · 偏好" : ""}`;
  }
  return `事件 · ${t.event === "Join" ? "加入聊天" : "离开聊天"}`;
}

// 多触发摘要：满足任一即触发，用「 + 」连接每条触发条件
export function summarizeTriggers(triggers: ResponseTrigger[]): string {
  if (triggers.length === 0) return "无触发（不触发）";
  if (triggers.length === 1) return summarizeTrigger(triggers[0]);
  return (
    triggers
      .slice(0, 2)
      .map((t) => summarizeTrigger(t))
      .join(" + ") + (triggers.length > 2 ? ` +${triggers.length - 2}` : "")
  );
}

// 用于筛选/校验的「首个活动触发」（保持与旧单触发逻辑一致）
export function firstActivityTrigger(triggers: ResponseTrigger[]) {
  return triggers.find((t) => t.mode === "activity") ?? null;
}
