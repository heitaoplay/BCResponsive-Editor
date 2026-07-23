import { useState } from "react";
import type { ResponsivePersonality } from "../types";
import { mergePersonas, type MergeMode, type MergeOptions } from "../ops";

interface MergePanelProps {
  personas: ResponsivePersonality[];
  setPersonas: (p: ResponsivePersonality[]) => void;
}

export function MergePanel({ personas, setPersonas }: MergePanelProps) {
  const [targetIdx, setTargetIdx] = useState(0);
  const [sources, setSources] = useState<number[]>([]);
  const [mode, setMode] = useState<MergeMode>("append");
  const [messageMerge, setMessageMerge] = useState<MergeOptions["messageMerge"]>("concat");
  const [newName, setNewName] = useState("合并人格");
  const [toNew, setToNew] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (personas.length < 2) {
    return (
      <div className="panel">
        <h2>合并数据</h2>
        <div className="alert">
          合并需要至少 <strong>2 套</strong>人格数据。请先通过「导入」载入多套，或在「编辑」页创建多套人格。
        </div>
      </div>
    );
  }

  const toggleSource = (i: number) =>
    setSources((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  const run = () => {
    if (sources.length === 0) {
      setDone("请至少选择 1 个来源人格。");
      return;
    }
    const srcs = sources.map((i) => personas[i]);
    const target = toNew
      ? { name: newName || "合并人格", index: personas.length, responses: [], blackList: [] }
      : personas[targetIdx];
    const merged = mergePersonas(target, srcs, { mode, messageMerge });
    if (toNew) {
      setPersonas([...personas, { ...merged, index: personas.length }]);
    } else {
      setPersonas(personas.map((p, i) => (i === targetIdx ? merged : p)));
    }
    setDone(
      `合并完成：${target.name} + ${srcs.length} 套 → 共 ${merged.responses.length} 条响应。`
    );
  };

  return (
    <div className="panel">
      <h2>合并数据</h2>
      <p className="muted">
        将多套人格的<strong>响应（动作）</strong>合并为一整套。选择一个目标，勾选来源，选择合并策略。
      </p>

      <div className="field">
        <label className="checkbox-row">
          <input type="checkbox" checked={toNew} onChange={(e) => setToNew(e.target.checked)} />
          合并为<strong>新人格</strong>（不选则覆盖下方「目标人格」）
        </label>
        {toNew ? (
          <input
            className="text-input"
            value={newName}
            placeholder="新人格名称"
            onChange={(e) => setNewName(e.target.value)}
          />
        ) : (
          <div className="row">
            <span className="field-label">目标人格：</span>
            <select value={targetIdx} onChange={(e) => setTargetIdx(Number(e.target.value))}>
              {personas.map((p, i) => (
                <option key={i} value={i}>
                  {i + 1}. {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="field">
        <span className="field-label">来源人格（可多选）</span>
        <div className="check-grid">
          {personas.map((p, i) => (
            <label key={i} className={`check-item ${sources.includes(i) ? "on" : ""}`}>
              <input
                type="checkbox"
                checked={sources.includes(i)}
                disabled={!toNew && i === targetIdx}
                onChange={() => toggleSource(i)}
              />
              {i + 1}. {p.name}（{p.responses.length}）
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">合并策略</span>
        <select value={mode} onChange={(e) => setMode(e.target.value as MergeMode)}>
          <option value="append">追加（保留全部，重名自动加序号）</option>
          <option value="byName">按名称合并（同名响应合一）</option>
          <option value="replace">替换为最后一套来源（覆盖）</option>
        </select>
      </div>

      {mode === "byName" && (
        <div className="field">
          <span className="field-label">同名响应的消息处理</span>
          <select
            value={messageMerge}
            onChange={(e) => setMessageMerge(e.target.value as MergeOptions["messageMerge"])}
          >
            <option value="concat">拼接双方消息</option>
            <option value="keepTarget">保留目标消息</option>
            <option value="keepSource">保留来源消息</option>
          </select>
        </div>
      )}

      <div className="row">
        <button className="btn primary" onClick={run}>
          执行合并
        </button>
      </div>

      {done && <div className="alert success">{done}</div>}
    </div>
  );
}
