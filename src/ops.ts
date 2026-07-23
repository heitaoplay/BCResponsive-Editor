import type { ResponsivePersonality, ResponseItem } from "./types";

// ---------- 通用数组操作 ----------
export function move<T>(arr: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function removeAt<T>(arr: T[], i: number): T[] {
  const copy = arr.slice();
  copy.splice(i, 1);
  return copy;
}

// ---------- 合并逻辑 ----------
export type MergeMode = "append" | "byName" | "replace";

export interface MergeOptions {
  mode: MergeMode;
  // byName 模式下，同名响应的消息如何处理
  messageMerge: "keepTarget" | "keepSource" | "concat";
}

// 合并多个来源人格为一个目标人格
export function mergePersonas(
  target: ResponsivePersonality,
  sources: ResponsivePersonality[],
  opts: MergeOptions
): ResponsivePersonality {
  let responses: ResponseItem[] = target.responses.slice();

  for (const src of sources) {
    if (opts.mode === "replace") {
      responses = src.responses.slice();
      continue;
    }
    if (opts.mode === "append") {
      responses = responses.concat(renameDupes(responses, src.responses));
      continue;
    }
    if (opts.mode === "byName") {
      responses = mergeByName(responses, src.responses, opts.messageMerge);
      continue;
    }
  }

  const blackList = Array.from(new Set([...target.blackList, ...sources.flatMap((s) => s.blackList)]));
  return { ...target, responses, blackList };
}

// 把源响应的名字与已存在响应去重（追加模式下避免完全同名）
function renameDupes(existing: ResponseItem[], incoming: ResponseItem[]): ResponseItem[] {
  const names = new Set(existing.map((r) => r.name));
  return incoming.map((r) => {
    if (!names.has(r.name)) return r;
    let i = 1;
    let candidate = `${r.name} (${i})`;
    while (names.has(candidate)) {
      i++;
      candidate = `${r.name} (${i})`;
    }
    names.add(candidate);
    return { ...r, name: candidate };
  });
}

function mergeByName(
  target: ResponseItem[],
  source: ResponseItem[],
  messageMerge: MergeOptions["messageMerge"]
): ResponseItem[] {
  const result = target.slice();
  const byName = new Map(result.map((r) => [r.name, r]));
  for (const s of source) {
    const t = byName.get(s.name);
    if (!t) {
      result.push(s);
      byName.set(s.name, s);
      continue;
    }
    // 同名：用源的触发器，消息按策略合并
    let messages = t.messages;
    if (messageMerge === "keepSource") messages = s.messages;
    else if (messageMerge === "concat") messages = [...t.messages, ...s.messages];
    // keepTarget 不变
    const merged: ResponseItem = { ...s, messages };
    const idx = result.indexOf(t);
    result[idx] = merged;
    byName.set(s.name, merged);
  }
  return result;
}
