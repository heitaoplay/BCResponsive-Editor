// 与 BCResponsive 插件 100% 兼容的解析 / 序列化层
// 复刻插件源码：
//   - src/GUI/Persona/PersonaCompress.ts  (PersonaToLZString / LZStringToPersona)
//   - src/Data/V2.ts                       (V2ValidatePersonality / isNumberArray / isStringArray)
//   - src/Data/Data.ts                     (EncodeDataStr —— 全套设置压缩)
import LZString from "lz-string";
const { compressToBase64, decompressFromBase64 } = LZString;
import type {
  ResponsivePersonality,
  ResponsiveSettingV2,
  ResponseItem,
  ResponseMessage,
  ResponseMessageType,
  ResponseTrigger,
  ResponseTriggerMode,
  OrgasmTriggerType,
} from "./types";

/* ----------------------------- 基础校验工具 ----------------------------- */

function isStringArray(data: unknown): data is string[] {
  return Array.isArray(data) && data.every((_) => typeof _ === "string");
}
function isNumberArray(data: unknown): data is number[] {
  return Array.isArray(data) && data.every((_) => typeof _ === "number");
}

/* --------------------- 复刻插件 V2ValidatePersonality --------------------- */
// 返回 null 表示非法；否则返回规范化后的 Persona（保留 blackList，插件本身也接受）

export function validatePersonality(
  arg: Partial<ResponsivePersonality> | undefined | null
): ResponsivePersonality | null {
  if (!arg || typeof arg !== "object") return null;
  if (typeof arg.name !== "string") return null;
  if (typeof arg.index !== "number") return null;
  if (!Array.isArray(arg.responses)) return null;

  const blackList: number[] = isNumberArray(arg.blackList) ? arg.blackList! : [];

  const responses: ResponseItem[] = [];
  for (const j of arg.responses as Partial<ResponseItem>[]) {
    if (typeof j !== "object" || j === null) continue;
    if (typeof j.name !== "string") continue;
    if (typeof j.trigger !== "object" || j.trigger === null) continue;

    const enabled = j.enabled === undefined ? true : !!j.enabled;

    const trigger = validateTrigger(j.trigger as ResponseTrigger);
    if (!trigger) continue;

    if (!Array.isArray(j.messages)) continue;
    const messages: ResponseMessage[] = [];
    for (const k of j.messages as Partial<ResponseMessage>[]) {
      if (typeof k !== "object" || k === null) continue;
      if (k.type !== "action" && k.type !== "message") continue;
      if (typeof k.content !== "string") continue;
      messages.push({ type: k.type, content: k.content });
    }

    responses.push({ name: j.name, enabled, trigger, messages });
  }

  return { name: arg.name, index: arg.index, responses, blackList };
}

function validateTrigger(t: ResponseTrigger): ResponseTrigger | null {
  const modes: ResponseTriggerMode[] = ["activity", "orgasm", "spicer", "event"];
  if (!modes.includes(t.mode)) return null;

  if (t.mode === "activity") {
    const allow_activities = t.allow_activities ?? undefined;
    const allow_bodyparts = t.allow_bodyparts ?? undefined;
    const allow_ids = t.allow_ids ?? undefined;
    if (allow_activities !== undefined && !isStringArray(allow_activities)) return null;
    if (allow_bodyparts !== undefined && !isStringArray(allow_bodyparts)) return null;
    if (allow_ids !== undefined && !isNumberArray(allow_ids)) return null;
    return { mode: "activity", allow_activities, allow_bodyparts, allow_ids };
  }

  if (t.mode === "orgasm") {
    const allowed: OrgasmTriggerType[] = ["Orgasmed", "Ruined", "Resisted", "Any"];
    const type = allowed.includes((t as any).type) ? (t as any).type : "Orgasmed";
    return { mode: "orgasm", type };
  }

  if (t.mode === "spicer") {
    const tt = t as any;
    const min_arousal = typeof tt.min_arousal === "number" ? tt.min_arousal : undefined;
    const max_arousal = typeof tt.max_arousal === "number" ? tt.max_arousal : undefined;
    const apply_favorite =
      typeof tt.apply_favorite === "boolean" ? tt.apply_favorite : undefined;
    const allow_ids = tt.allow_ids ?? undefined;
    if (allow_ids !== undefined && !isNumberArray(allow_ids)) return null;
    return { mode: "spicer", min_arousal, max_arousal, apply_favorite, allow_ids };
  }

  if (t.mode === "event") {
    const ev = (t as any).event;
    if (ev !== "Join" && ev !== "Leave") return null;
    return { mode: "event", event: ev };
  }

  return null;
}

/* ----------------------- 复刻插件 PersonaCompress ----------------------- */
// 说明：插件原版 PersonaToLZString 只序列化 {name, responses}（会丢 blackList）。
// 这里额外保留 blackList —— 插件的 V2ValidatePersonality 本就接受并保留该字段，
// 因此对插件导入完全兼容，且更利于用户（避免黑名单在往返中丢失）。

export function personaToLZString(p: ResponsivePersonality): string {
  const payload = {
    name: p.name,
    responses: p.responses,
    blackList: p.blackList ?? [],
  };
  return compressToBase64(JSON.stringify(payload));
}

export function lzStringToPersona(src: string): ResponsivePersonality | null {
  const d = decompressFromBase64(src);
  if (!d) return null;
  let data: any;
  try {
    data = JSON.parse(d);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  // 复刻插件：Object.assign(data, { index: -1 }) 后再校验
  data.index = -1;
  return validatePersonality(data);
}

/* ----------------------- 全套设置（ExtensionSettings） ----------------------- */

export function settingsToLZString(s: ResponsiveSettingV2): string {
  return compressToBase64(JSON.stringify(s));
}

export function lzStringToSettings(src: string): ResponsiveSettingV2 | null {
  const d = decompressFromBase64(src);
  if (!d) return null;
  let data: any;
  try {
    data = JSON.parse(d);
  } catch {
    return null;
  }
  return validateSettings(data);
}

export function validateSettings(data: any): ResponsiveSettingV2 | null {
  if (typeof data !== "object" || data === null) return null;
  if (typeof data.settings !== "object" || data.settings === null) return null;
  if (
    data.active_personality !== null &&
    typeof data.active_personality !== "number"
  )
    return null;
  if (!Array.isArray(data.personalities)) return null;

  const personalities = data.personalities.map((p: any) =>
    p ? validatePersonality(p) : null
  );
  return {
    settings: {
      enabled: typeof data.settings.enabled === "boolean" ? data.settings.enabled : true,
    },
    active_personality:
      typeof data.active_personality === "number" ? data.active_personality : null,
    personalities,
  };
}

/* --------------------- 损坏识别（导入失败时的友好提示） --------------------- */
// 背景：用户从插件导出后，长串在复制 / 聊天传输中容易被改动一个字符，
// 导致 lz-string 位流错位、整段无法解压。此时原始内容「看起来像」BCResponsive 压缩串，
// 但 decompressFromBase64 直接返回空。这里尝试从干净前缀里识别出人格名，给出针对性提示。

const LZ_BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

function looksLikeLZString(s: string): boolean {
  if (s.length < 8) return false;
  if (s.length % 4 !== 0) return false;
  for (const c of s) if (!LZ_BASE64_ALPHABET.includes(c)) return false;
  return true;
}

function detectCorruption(raw: string): string | null {
  if (!looksLikeLZString(raw)) return null;
  // 人格名（name）必定在导出字符串的开头附近。损坏往往发生在中段（字符被改动导致位流错位），
  // 因此从开头起扫描「能解出合法 {name} 的最短干净前缀」即可定位到人格名。
  // 为控制成本，只扫描前 8000 字符、步长 25（对真实人格导出足够覆盖 name 所在边界）。
  let name: string | null = null;
  const cap = Math.min(raw.length, 8000);
  for (let len = 200; len <= cap; len += 25) {
    const d = decompressFromBase64(raw.slice(0, len));
    if (!d || d[0] !== "{") continue;
    // 干净前缀往往只能解出「截断的 JSON」，JSON.parse 会失败；但 name 在开头，可被正则提取
    try {
      const j = JSON.parse(d);
      if (j && typeof j === "object" && typeof j.name === "string") {
        name = j.name;
        break;
      }
    } catch {
      const m = d.match(/"name"\s*:\s*"([^"]*)"/);
      if (m) {
        name = m[1];
        break;
      }
    }
  }
  if (name) {
    return `检测到这应该是人格「${name}」的 BCResponsive 导出代码，但数据中段似乎在复制 / 传输过程中损坏，无法完整解压。请重新从插件完整导出，并尽量使用「上传文件」方式导入（长文本复制容易在中间被改动）。`;
  }
  return `这看起来是 BCResponsive 的压缩代码，但已损坏或不完整，无法解压。请确认完整复制了插件导出的整段字符，或改用「上传文件」导入避免复制错误。`;
}

/* ----------------------------- 统一导入解析 ----------------------------- */
// 支持三种输入：压缩串（单人格 / 全套）、原始 JSON（单人格对象 / 全套对象 / 人格数组）

export type ImportResult =
  | {
      ok: true;
      kind: "persona" | "settings" | "personaArray";
      personas: ResponsivePersonality[];
      settings?: ResponsiveSettingV2;
    }
  | { ok: false; error: string };

export function parseInput(raw: string): ImportResult {
  const text = raw.trim();
  if (!text) return { ok: false, error: "内容为空，请粘贴或上传人格数据。" };

  // 1) 先尝试当作原始 JSON 解析（用户可能直接贴 JSON）
  try {
    const json = JSON.parse(text);
    const fromJson = parseJsonStructure(json);
    if (fromJson) return fromJson;
    // JSON 合法但结构不符，继续尝试压缩串（极少情况）
  } catch {
    /* 不是 JSON，继续 */
  }

  // 2) 尝试 LZString 压缩串
  const d = decompressFromBase64(text);
  if (!d) {
    // 增强：识别「看起来是 BCResponsive 压缩串但已损坏/不完整」的情况，给出更具体的引导
    const hint = detectCorruption(text);
    return {
      ok: false,
      error:
        hint ??
        "无法识别此内容：既不是有效的人格代码（可能复制不完整），也不是 JSON。请确认完整复制了插件导出的整段字符。",
    };
  }
  let data: any;
  try {
    data = JSON.parse(d);
  } catch {
    return {
      ok: false,
      error: "数据已损坏：解压成功但内部不是合法 JSON，请重新从插件导出。",
    };
  }
  const fromJson = parseJsonStructure(data);
  if (fromJson) return fromJson;
  return {
    ok: false,
    error: "数据结构无法识别：解压后的内容不符合人格或全套设置的格式。",
  };
}

function parseJsonStructure(json: any): ImportResult | null {
  if (json === null || typeof json !== "object") return null;

  // 全套设置：含 settings + personalities
  if (Array.isArray(json.personalities) && typeof json.settings === "object") {
    const s = validateSettings(json);
    if (!s) return null;
    const personas = s.personalities.filter((p): p is ResponsivePersonality => p !== null);
    return { ok: true, kind: "settings", personas, settings: s };
  }

  // 人格数组
  if (Array.isArray(json)) {
    const personas = json
      .map((p) => validatePersonality(p))
      .filter((p): p is ResponsivePersonality => p !== null);
    if (personas.length === 0) return null;
    return { ok: true, kind: "personaArray", personas };
  }

  // 单个单人格对象
  if (typeof json.name === "string" && Array.isArray(json.responses)) {
    const p = validatePersonality(json);
    if (!p) return null;
    return { ok: true, kind: "persona", personas: [p] };
  }

  return null;
}

/* ------------------------------- 工厂函数 ------------------------------- */

export function newPersona(index: number, name = "新人格"): ResponsivePersonality {
  return { name, index, responses: [], blackList: [] };
}

export function newResponse(name = "新响应"): ResponseItem {
  return {
    name,
    enabled: true,
    trigger: { mode: "activity", allow_activities: undefined },
    messages: [],
  };
}

export function newMessage(type: ResponseMessageType = "message"): ResponseMessage {
  return { type, content: "" };
}
