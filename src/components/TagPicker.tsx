import { useState } from "react";

interface TagPickerProps {
  label: string;
  // 当前值：undefined 表示「全部」（插件语义）；[] 表示「无」
  value: string[] | undefined | null;
  // 候选词（用于自动补全），可为空
  suggestions?: string[];
  // 「全部」选项的含义说明
  allHint?: string;
  placeholder?: string;
  onChange: (v: string[] | undefined) => void;
}

// 多值标签选择器：点击候选词或回车添加；已选项以可删除标签展示。
// 插件语义：空数组 = 无；这里用「全部」开关代表 undefined。
export function TagPicker({
  label,
  value,
  suggestions = [],
  allHint,
  placeholder,
  onChange,
}: TagPickerProps) {
  const [draft, setDraft] = useState("");
  const isAll = value === undefined || value === null;
  const selected = isAll ? [] : value;

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (selected.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...selected, t]);
    setDraft("");
  };

  const removeTag = (t: string) => {
    onChange(selected.filter((x) => x !== t));
  };

  const filtered = suggestions
    .filter((s) => !selected.includes(s))
    .filter((s) => s.toLowerCase().includes(draft.toLowerCase()));

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
            {selected.length === 0 && (
              <span className="tag-empty">（无 — 将不触发任何{label.replace("触发", "") || "项"}）</span>
            )}
            {selected.map((t) => (
              <span key={t} className="tag">
                {t}
                <button className="tag-x" onClick={() => removeTag(t)} title="移除">
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            className="text-input"
            list={`${label}-dl`}
            value={draft}
            placeholder={placeholder ?? "输入后回车添加，或点下方候选"}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(draft);
              }
            }}
          />
          <datalist id={`${label}-dl`}>
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {draft && filtered.length > 0 && (
            <div className="suggest">
              {filtered.slice(0, 12).map((s) => (
                <button key={s} className="suggest-item" onClick={() => addTag(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {allHint && <div className="hint">{allHint}</div>}
        </>
      )}
    </div>
  );
}
