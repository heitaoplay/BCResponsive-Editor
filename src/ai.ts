// AI 协作格式：让外部 AI 模型可读 / 改 / 生成人格内容，并无损回导入网站。
// 两种形态：
//   1) Markdown 协作档（buildAIMarkdown）：人类/AI 可读散文 + 文末 `<!-- bcjson -->` 无损机器块。
//      回导入时：机器块提供 triggers/结构（权威），散文覆盖 intent/messages/state/marker（AI 改的文本）。
//   2) 注释 JSON（buildAIJson）：结构化 JSON，AI 易于解析与批量改写，round-trip 原生无损。
import type {
  ResponsivePersonality,
  ResponseItem,
  ResponseTrigger,
  ResponseMessage,
  ResponseMeta,
} from "./types";
import { validateTrigger, type ImportResult } from "./compat";

const AI_FORMAT = "bcresponsive-ai/v1";

/* ----------------------------- 触发器 → 人话 ----------------------------- */

function triggerToText(t: ResponseTrigger): string {
  switch (t.mode) {
    case "activity": {
      const acts =
        t.allow_activities && t.allow_activities.length
          ? t.allow_activities.join(", ")
          : "全部活动";
      const parts = t.allow_bodyparts?.length ? `（部位：${t.allow_bodyparts.join(", ")}）` : "";
      const ids = t.allow_ids?.length ? `（成员：${t.allow_ids.join(", ")}）` : "";
      return `活动：${acts}${parts}${ids}`;
    }
    case "orgasm":
      return `高潮：${t.type}`;
    case "spicer": {
      const lo = t.min_arousal ?? "任意";
      const hi = t.max_arousal ?? "任意";
      const fav = t.apply_favorite ? "（偏好动作）" : "";
      const ids = t.allow_ids?.length ? `（成员：${t.allow_ids.join(", ")}）` : "";
      return `兴奋度：${lo}–${hi}${fav}${ids}`;
    }
    case "event":
      return `进出聊天：${t.event === "Join" ? "加入" : "离开"}`;
  }
}

function metaOf(r: ResponseItem): ResponseMeta {
  return r.meta ?? {};
}

/* ----------------------------- 内部 payload ----------------------------- */

// 在 Markdown / 注释 JSON 间共享的中间结构（triggers 为 BC 合法数组；meta 字段平铺）
function personaToAIPayload(p: ResponsivePersonality) {
  return {
    name: p.name,
    blackList: p.blackList ?? [],
    responses: p.responses.map((r) => ({
      name: r.name,
      enabled: r.enabled,
      intent: r.meta?.intent ?? null,
      triggers: r.triggers,
      messages: r.messages,
      state: r.meta?.state ?? null,
      marker: r.meta?.marker ?? null,
    })),
  };
}

/* ----------------------------- 构建：Markdown ----------------------------- */

export function buildAIMarkdown(p: ResponsivePersonality): string {
  const lines: string[] = [];
  lines.push(`# 人格：${p.name}`);
  lines.push("");
  lines.push(`> 黑名单(member ids)：${(p.blackList ?? []).join(", ") || "（无）"}`);
  lines.push("");
  lines.push("> **AI 编辑规则（必须遵守）：**");
  lines.push(
    "> 1. 你可自由改写每个响应下的【意图】/【[文本]】/【[动作]】/【[状态]】/【[标记]】文案，使其更自然或更符合角色。"
  );
  lines.push(
    "> 2. 文末 `<!-- bcjson ... -->` 是机器结构化数据，**必须原样保留**：不要删除、不要改写、不要重新格式化、不要移动位置。回导入时以它为准。"
  );
  lines.push(
    "> 3. 触发条件（「满足任一即触发」下的条目）是游戏内事件结构，除非你完全确定字段格式，否则不要改动；如需调整请在机器块 `triggers` 中保持相同字段。"
  );
  lines.push("> 4. 不要增删「响应」条目，不要改变人格名。改完把整篇内容（含机器块）一起返回。");
  lines.push("");
  p.responses.forEach((r, i) => {
    const m = metaOf(r);
    lines.push(`## 响应 ${i + 1}：${r.name}  ·  [${r.enabled ? "启用" : "禁用"}]`);
    lines.push(`- 意图：${m.intent || "（无）"}`);
    lines.push("- 触发（满足任一即触发）：");
    r.triggers.forEach((t) => lines.push(`  - ${triggerToText(t)}`));
    lines.push("- 输出：");
    if (r.messages.length === 0 && !m.state && !m.marker) lines.push("  - （无）");
    r.messages.forEach((msg) => {
      lines.push(`  - [${msg.type === "action" ? "动作" : "文本"}] ${msg.content}`);
    });
    if (m.state) lines.push(`  - [状态] ${m.state}`);
    if (m.marker) lines.push(`  - [标记] ${m.marker}`);
    lines.push("");
  });
  lines.push("<!-- bcjson");
  lines.push(JSON.stringify(personaToAIPayload(p), null, 2));
  lines.push("-->");
  return lines.join("\n");
}

/* ----------------------------- 构建：注释 JSON ----------------------------- */

export function buildAIJson(p: ResponsivePersonality): string {
  return JSON.stringify(
    {
      format: AI_FORMAT,
      _edit_guide:
        "BCResponsive AI 人格配置。可自由修改 responses 中每项的 name / intent / messages[].content / state / marker 文案；triggers 为触发条件结构，修改须保持原字段名与类型。不要修改 format 字段，不要增删响应条目，改完整体返回此 JSON。",
      persona: personaToAIPayload(p),
    },
    null,
    2
  );
}

/* ----------------------------- 解析：回导入 ----------------------------- */

function buildPersonaFromAI(obj: any): ImportResult {
  if (!obj || typeof obj !== "object") return { ok: false, error: "AI 文档结构无效。" };
  if (typeof obj.name !== "string") return { ok: false, error: "AI 文档缺少人格 name。" };
  if (!Array.isArray(obj.responses)) return { ok: false, error: "AI 文档缺少 responses 数组。" };

  const blackList = Array.isArray(obj.blackList)
    ? obj.blackList.filter((x: any) => typeof x === "number")
    : [];

  const responses: ResponseItem[] = [];
  for (const j of obj.responses) {
    if (!j || typeof j.name !== "string") continue;

    const rawTriggers = Array.isArray(j.triggers)
      ? j.triggers
      : j.trigger
        ? [j.trigger]
        : [];
    const triggers: ResponseTrigger[] = [];
    for (const t of rawTriggers) {
      const vt = validateTrigger(t as ResponseTrigger);
      if (vt) triggers.push(vt);
    }
    if (triggers.length === 0) continue;

    const enabled = j.enabled === undefined ? true : !!j.enabled;

    const messages: ResponseMessage[] = [];
    const pushMsgs = (arr: any, label: string) => {
      if (!Array.isArray(arr)) return;
      for (const k of arr) {
        if (!k || (k.type !== "action" && k.type !== "message")) continue;
        if (typeof k.content !== "string") continue;
        messages.push({ type: k.type, content: k.content });
      }
    };
    pushMsgs(j.messages, "messages");
    if (messages.length === 0 && j.outputs) pushMsgs(j.outputs.messages, "outputs.messages");

    const meta: ResponseMeta = {};
    if (typeof j.intent === "string" && j.intent.trim()) meta.intent = j.intent;
    if (typeof j.state === "string" && j.state.trim()) meta.state = j.state;
    if (typeof j.marker === "string" && j.marker.trim()) meta.marker = j.marker;
    if (j.outputs) {
      if (typeof j.outputs.state === "string" && j.outputs.state.trim())
        meta.state = j.outputs.state;
      if (typeof j.outputs.marker === "string" && j.outputs.marker.trim())
        meta.marker = j.outputs.marker;
    }

    responses.push({
      name: j.name,
      enabled,
      triggers,
      messages,
      meta: Object.keys(meta).length ? meta : undefined,
    });
  }

  if (responses.length === 0)
    return { ok: false, error: "AI 文档中未解析出任何有效响应（触发条件均不合法？）。" };

  return {
    ok: true,
    kind: "persona",
    personas: [{ name: obj.name, index: -1, responses, blackList }],
  };
}

// 散文覆盖：按响应顺序把「意图 / [文本] / [动作] / [状态] / [标记]」写回机器块解析结果
function overlayProse(text: string, res: Extract<ImportResult, { ok: true }>) {
  const p = res.personas[0];
  const blocks = text.split(/^##\s+响应\s/gm).slice(1);
  blocks.forEach((block, i) => {
    const r = p.responses[i];
    if (!r) return;

    const intentM = block.match(/^\s*-\s*意图[：:]\s*(.+)$/m);
    if (intentM) {
      const v = intentM[1].trim();
      if (v && v !== "（无）") r.meta = { ...(r.meta || {}), intent: v };
    }

    const msgLines = [...block.matchAll(/^\s*-\s*\[(文本|动作)\]\s*(.*)$/gm)];
    if (msgLines.length > 0) {
      r.messages = msgLines.map((mm) => ({
        type: mm[1] === "动作" ? "action" : "message",
        content: mm[2],
      }));
    }

    const stateM = block.match(/^\s*-\s*\[状态\]\s*(.+)$/m);
    if (stateM) r.meta = { ...(r.meta || {}), state: stateM[1].trim() };

    const markerM = block.match(/^\s*-\s*\[标记\]\s*(.+)$/m);
    if (markerM) r.meta = { ...(r.meta || {}), marker: markerM[1].trim() };

    if (r.meta && Object.keys(r.meta).length === 0) r.meta = undefined;
  });
}

function parseAIMarkdown(text: string): ImportResult {
  // 要求 bcjson 后紧跟换行，避免与散文里提到的 `<!-- bcjson -->` 字样冲突
  const m = text.match(/<!--\s*bcjson\s*\n([\s\S]*?)-->/);
  if (!m) {
    return {
      ok: false,
      error:
        "未找到 `<!-- bcjson -->` 机器块，无法无损解析。请保留文末机器块后再导入（不要删除 `<!-- bcjson ... -->`）。",
    };
  }
  let payload: any;
  try {
    payload = JSON.parse(m[1]);
  } catch {
    return { ok: false, error: "bcjson 机器块不是合法 JSON，无法解析。" };
  }
  const res = buildPersonaFromAI(payload);
  if (!res.ok) return res;
  // 用散文覆盖 AI 改过的文本/意图/状态/标记（机器块提供触发条件与结构）
  try {
    overlayProse(text, res);
  } catch {
    /* 覆盖失败则保留机器块结果 */
  }
  return res;
}

// 自动识别并解析 AI 协作档（Markdown 或 注释 JSON）。无法识别返回 null。
export function parseAIDoc(text: string): ImportResult | null {
  const t = text.trim();
  if (!t) return null;

  // 1) Markdown 协作档
  if (t.startsWith("#") || t.includes("<!-- bcjson")) {
    return parseAIMarkdown(t);
  }

  // 2) 注释 JSON（带 format 标记）
  try {
    const json = JSON.parse(t);
    if (json && json.format === AI_FORMAT && json.persona) {
      return buildPersonaFromAI(json.persona);
    }
  } catch {
    /* 不是 JSON */
  }
  return null;
}
