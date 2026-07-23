import { useState } from "react";

interface NumberListProps {
  label: string;
  value: number[] | undefined | null;
  placeholder?: string;
  onChange: (v: number[] | undefined) => void;
}

// 数字 ID 列表编辑器（成员白/黑名单）。undefined = 全部；[] = 无。
export function NumberList({ label, value, placeholder, onChange }: NumberListProps) {
  const [draft, setDraft] = useState("");
  const isAll = value === undefined || value === null;
  const list = isAll ? [] : value;

  const add = () => {
    const n = parseInt(draft.trim(), 10);
    if (isNaN(n) || n <= 0) {
      setDraft("");
      return;
    }
    if (list.includes(n)) {
      setDraft("");
      return;
    }
    onChange([...list, n]);
    setDraft("");
  };

  return (
    <div className="tagpicker">
      <div className="tagpicker-head">
        <span className="field-label">{label}</span>
        <label className="all-toggle">
          <input
            type="checkbox"
            checked={isAll}
            onChange={(e) => onChange(e.target.checked ? undefined : [])}
          />
          全部（不限制）
        </label>
      </div>
      {!isAll && (
        <>
          <div className="tag-list">
            {list.length === 0 && <span className="tag-empty">（无）</span>}
            {list.map((n) => (
              <span key={n} className="tag">
                {n}
                <button className="tag-x" onClick={() => onChange(list.filter((x) => x !== n))} title="移除">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="num-add">
            <input
              className="text-input"
              type="number"
              min={1}
              value={draft}
              placeholder={placeholder ?? "输入成员数字 ID 后回车"}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
            />
            <button className="btn small" onClick={add}>
              添加
            </button>
          </div>
          <div className="hint">提示：插件的成员列表只接受数字 ID，非好友会显示为 «???»。</div>
        </>
      )}
    </div>
  );
}
