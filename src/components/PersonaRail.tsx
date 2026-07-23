import { useState } from "react";
import type { ResponsivePersonality } from "../types";
import { ConfirmInline } from "./ConfirmInline";
import { useToast } from "./Toast";

interface PersonaRailProps {
  personas: ResponsivePersonality[];
  selected: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  onDuplicate: (i: number) => void;
  onDelete: (i: number, name: string) => void;
  onReorder: (from: number, to: number) => void;
}

// 左栏人格列表：搜索 + 选中高亮 + 拖拽排序 + 行内删除确认。
export function PersonaRail(props: PersonaRailProps) {
  const { personas, selected, onSelect, onAdd, onDuplicate, onDelete, onReorder } = props;
  const toast = useToast();
  const [q, setQ] = useState("");
  const [confirming, setConfirming] = useState<number | null>(null);
  const [armed, setArmed] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const lower = q.trim().toLowerCase();
  const shown = personas
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => (lower ? p.name.toLowerCase().includes(lower) : true));

  const onDrop = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      onReorder(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <aside className="persona-rail" aria-label="人格列表">
      <input
        className="text-input rail-search"
        value={q}
        placeholder="搜索人格…"
        aria-label="搜索人格"
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="rail-list">
        {shown.length === 0 && <div className="muted rail-empty">无匹配人格</div>}
        {shown.map(({ p, i }) => {
          const enabledCount = p.responses.filter((r) => r.enabled).length;
          const isSel = i === selected;
          return (
            <div
              key={i}
              className={`rail-item ${isSel ? "selected" : ""} ${
                dragIndex === i ? "dragging" : ""
              } ${overIndex === i && dragIndex !== i ? "drag-over" : ""}`}
              draggable={armed}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                setDragIndex(i);
              }}
              onDragEnd={() => {
                setArmed(false);
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setOverIndex(i)}
              onDrop={onDrop}
              onClick={() => onSelect(i)}
            >
              <span
                className="drag-handle"
                title="拖拽排序"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setArmed(true);
                }}
                onPointerUp={() => setArmed(false)}
              >
                ⠿
              </span>
              <span className={`rail-dot ${enabledCount > 0 ? "on" : ""}`} title={`${enabledCount} 条已启用`} />
              <span className="rail-name">{p.name || "(未命名)"}</span>
              <span className="rail-count">{p.responses.length}</span>
              {confirming === i ? (
                <ConfirmInline
                  message="删除该人格？"
                  onConfirm={() => {
                    onDelete(i, p.name);
                    setConfirming(null);
                    toast.push(`已删除人格「${p.name || "(未命名)"}」`, "warn");
                  }}
                  onCancel={() => setConfirming(null)}
                />
              ) : (
                <button
                  type="button"
                  className="rail-del"
                  title="删除人格"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirming(i);
                  }}
                >
                  ×
                </button>
              )}
              <button
                type="button"
                className="rail-dup"
                title="复制人格"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(i);
                  toast.push("已复制人格", "success");
                }}
              >
                ⧉
              </button>
            </div>
          );
        })}
      </div>
      <button type="button" className="btn primary rail-add" onClick={onAdd}>
        + 新建人格
      </button>
    </aside>
  );
}
