import { useMemo, useState } from "react";
import { ALL_ACTIVITIES, ACTIVITY_CATEGORIES } from "../data";

interface ActivityPickerProps {
  label: string;
  // undefined = 全部活动；[] = 不触发任何；string[] = 指定活动
  value: string[] | undefined | null;
  onChange: (v: string[] | undefined) => void;
  allHint?: string;
}

// 活动选择器：搜索框 + 候选 + 分类折叠 chip 组 + 「已选 X / 共 Y」计数。
// 取代原 TriggerEditor 中冗长铺开的 TagPicker + 分类 details，应对 50+ 活动。
export function ActivityPicker({ label, value, onChange, allHint }: ActivityPickerProps) {
  const isAll = value === undefined || value === null;
  const selected = useMemo(() => (isAll ? [] : value ?? []), [isAll, value]);
  const [q, setQ] = useState("");
  const [openCat, setOpenCat] = useState<string | null>(null);

  const toggle = (a: string) => {
    if (selected.includes(a)) onChange(selected.filter((x) => x !== a));
    else onChange([...selected, a]);
  };

  const suggestions = useMemo(() => {
    const lower = q.toLowerCase();
    return ALL_ACTIVITIES.filter(
      (a) => !selected.includes(a) && a.toLowerCase().includes(lower)
    ).slice(0, 24);
  }, [q, selected]);

  return (
    <div className="activity-picker">
      <div className="ap-head">
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
          <div className="ap-count">
            已选 <b>{selected.length}</b> / 共 {ALL_ACTIVITIES.length}
          </div>

          {selected.length > 0 && (
            <div className="tag-list">
              {selected.map((t) => (
                <span key={t} className="tag">
                  {t}
                  <button
                    type="button"
                    className="tag-x"
                    onClick={() => toggle(t)}
                    title="移除"
                    aria-label={`移除 ${t}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <input
            className="text-input"
            value={q}
            placeholder="搜索活动后回车 / 点选添加…"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && suggestions[0]) {
                e.preventDefault();
                toggle(suggestions[0]);
                setQ("");
              }
            }}
          />
          {q && suggestions.length > 0 && (
            <div className="suggest">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="suggest-item"
                  onClick={() => {
                    toggle(s);
                    setQ("");
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <details className="help ap-cats">
            <summary>按分类浏览 / 勾选</summary>
            <div className="cat-acc">
              {ACTIVITY_CATEGORIES.map((c) => {
                const open = openCat === c.label;
                const onCount = c.items.filter((it) => selected.includes(it)).length;
                return (
                  <div key={c.label} className="cat-acc-item">
                    <button
                      type="button"
                      className="cat-acc-head"
                      aria-expanded={open}
                      onClick={() => setOpenCat(open ? null : c.label)}
                    >
                      <span className="caret">{open ? "▾" : "▸"}</span>
                      {c.label}
                      {onCount > 0 && <span className="cat-on-count">{onCount}</span>}
                    </button>
                    {open && (
                      <div className="cat-items">
                        {c.items.map((it) => {
                          const on = selected.includes(it);
                          return (
                            <button
                              key={it}
                              type="button"
                              className={`chip ${on ? "on" : ""}`}
                              aria-pressed={on}
                              onClick={() => toggle(it)}
                            >
                              {it}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </details>

          {allHint && <div className="hint">{allHint}</div>}
        </>
      )}
    </div>
  );
}
