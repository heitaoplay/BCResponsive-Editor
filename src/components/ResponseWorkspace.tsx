import { useMemo, useRef, useState } from "react";
import type {
  ResponsivePersonality,
  ResponseItem,
  ResponseTriggerMode,
} from "../types";
import { newResponse } from "../compat";
import { move, removeAt } from "../ops";
import { ResponseCard } from "./ResponseCard";
import { NumberList } from "./NumberList";
import { useToast } from "./Toast";

type FilterMode = "all" | ResponseTriggerMode;
type FilterEnabled = "all" | "enabled" | "disabled";

interface ResponseWorkspaceProps {
  persona: ResponsivePersonality;
  onChange: (p: ResponsivePersonality) => void;
  onDuplicatePersona: () => void;
  onDeletePersona: () => void;
}

// 右栏工作区：人格名行内编辑 + 黑名单 + 工具栏（新建/筛选/搜索）+ 拖拽排序的响应列表。
export function ResponseWorkspace(props: ResponseWorkspaceProps) {
  const { persona, onChange, onDuplicatePersona, onDeletePersona } = props;
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filterEnabled, setFilterEnabled] = useState<FilterEnabled>("all");
  const [warnOnly, setWarnOnly] = useState(false);
  const [blackListOpen, setBlackListOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const set = (patch: Partial<ResponsivePersonality>) =>
    onChange({ ...persona, ...patch });

  const updateResponse = (ri: number, fn: (r: ResponseItem) => ResponseItem) =>
    set({ responses: persona.responses.map((r, idx) => (idx === ri ? fn(r) : r)) });

  const addResponse = () => {
    const nr = newResponse();
    const at = persona.responses.length;
    set({ responses: [...persona.responses, nr] });
    setLastAdded(at);
    toast.push("已新增响应", "success");
    window.setTimeout(() => setLastAdded((cur) => (cur === at ? null : cur)), 1200);
  };

  const duplicateResponse = (ri: number) => {
    const src = persona.responses[ri];
    const copy: ResponseItem = JSON.parse(JSON.stringify(src));
    copy.name = `${src.name} 副本`;
    const next = [...persona.responses];
    next.splice(ri + 1, 0, copy);
    set({ responses: next });
    setLastAdded(ri + 1);
    toast.push("已复制响应", "success");
  };

  const deleteResponse = (ri: number, name: string) => {
    set({ responses: removeAt(persona.responses, ri) });
    toast.push(`已删除响应「${name || "(未命名)"}」`, "warn");
  };

  const reorder = (from: number, to: number) => {
    set({ responses: move(persona.responses, from, to) });
  };

  const isWarn = (r: ResponseItem) =>
    (r.trigger.mode === "activity" && (r.trigger as any).allow_activities?.length === 0) ||
    r.messages.length === 0;

  const visible = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return persona.responses
      .map((r, i) => ({ r, i }))
      .filter(({ r, i }) => {
        if (filterMode !== "all" && r.trigger.mode !== filterMode) return false;
        if (filterEnabled === "enabled" && !r.enabled) return false;
        if (filterEnabled === "disabled" && r.enabled) return false;
        if (warnOnly && !isWarn(r)) return false;
        if (lower && !r.name.toLowerCase().includes(lower)) return false;
        return true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona.responses, q, filterMode, filterEnabled, warnOnly]);

  const onDrop = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      reorder(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const cards = listRef.current?.querySelectorAll<HTMLElement>("[data-rindex]");
    if (!cards || cards.length === 0) return;
    const active = document.activeElement as HTMLElement | null;
    const cur = active?.getAttribute("data-rindex");
    let next = 0;
    if (cur !== null) {
      const ci = Number(cur);
      next = e.key === "ArrowDown" ? Math.min(cards.length - 1, ci + 1) : Math.max(0, ci - 1);
    }
    e.preventDefault();
    cards[next]?.focus();
  };

  return (
    <section className="workspace" aria-label="响应工作区">
      <header className="ws-head">
        <input
          className="ws-name"
          value={persona.name}
          placeholder="人格名称"
          aria-label="人格名称"
          onChange={(e) => set({ name: e.target.value })}
        />
        <span className="badge">{persona.responses.length} 响应</span>
        <button
          type="button"
          className="badge gray ws-bl-btn"
          onClick={() => setBlackListOpen((v) => !v)}
          aria-expanded={blackListOpen}
        >
          黑名单 {persona.blackList.length}
        </button>
        <span className="spacer" />
        <button type="button" className="btn small" onClick={onDuplicatePersona} title="复制人格">
          复制
        </button>
        <button type="button" className="btn small danger" onClick={onDeletePersona} title="删除人格">
          删除
        </button>
      </header>

      {blackListOpen && (
        <div className="ws-bl-panel">
          <NumberList
            label="触发成员 ID 黑名单 (blackList)"
            value={persona.blackList}
            onChange={(v) => set({ blackList: v ?? [] })}
          />
        </div>
      )}

      <div className="ws-toolbar">
        <button type="button" className="btn primary" onClick={addResponse}>
          + 新响应
        </button>
        <input
          className="text-input ws-search"
          value={q}
          placeholder="搜索响应名称…"
          aria-label="搜索响应"
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="ws-filter"
          value={filterMode}
          aria-label="按模式筛选"
          onChange={(e) => setFilterMode(e.target.value as FilterMode)}
        >
          <option value="all">全部模式</option>
          <option value="activity">互动活动</option>
          <option value="orgasm">高潮</option>
          <option value="spicer">兴奋度</option>
          <option value="event">进出聊天</option>
        </select>
        <select
          className="ws-filter"
          value={filterEnabled}
          aria-label="按启用状态筛选"
          onChange={(e) => setFilterEnabled(e.target.value as FilterEnabled)}
        >
          <option value="all">全部状态</option>
          <option value="enabled">仅启用</option>
          <option value="disabled">仅禁用</option>
        </select>
        <label className="switch-inline">
          <input type="checkbox" checked={warnOnly} onChange={(e) => setWarnOnly(e.target.checked)} />
          仅看不触发
        </label>
        <span className="ws-saved">✓ 实时保存</span>
      </div>

      <div className="ws-list" ref={listRef} onKeyDown={onListKey}>
        {persona.responses.length === 0 && (
          <div className="alert">该人格还没有响应，点「+ 新响应」创建第一条。</div>
        )}
        {persona.responses.length > 0 && visible.length === 0 && (
          <div className="alert">没有符合筛选条件的响应，试试放宽筛选。</div>
        )}
        {visible.map(({ r, i }) => (
          <ResponseCard
            key={i}
            index={i}
            total={persona.responses.length}
            response={r}
            autoFocusName={lastAdded === i}
            justAdded={lastAdded === i}
            onChange={(nr) => updateResponse(i, () => nr)}
            onUp={() => reorder(i, i - 1)}
            onDown={() => reorder(i, i + 1)}
            onAddResponse={addResponse}
            onDelete={(name) => deleteResponse(i, name)}
            onDragStart={setDragIndex}
            onDragEnter={setOverIndex}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            isDragging={dragIndex === i}
            isOver={overIndex === i && dragIndex !== i}
          />
        ))}
      </div>

      {persona.responses.length > 0 && (
        <button type="button" className="btn primary ws-add-bottom" onClick={addResponse}>
          + 新响应
        </button>
      )}
    </section>
  );
}
