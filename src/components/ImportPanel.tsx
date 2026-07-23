import { useRef, useState } from "react";
import { parseInput, type ImportResult } from "../compat";
import { parseAIDoc } from "../ai";
import type { ResponsivePersonality, ResponsiveSettingV2 } from "../types";

interface ImportPanelProps {
  onLoaded: (
    personas: ResponsivePersonality[],
    settings: ResponsiveSettingV2 | null,
    appended: boolean
  ) => void;
}

const SAMPLE = `// 支持：插件「压缩代码」、原始 JSON、人格数组、全套设置，以及 AI 协作格式（Markdown / 注释 JSON）。
// 示例（原始 JSON，单人格；triggers 为触发条件数组，可多条）：
{
  "name": "示例人格",
  "responses": [
    {
      "name": "痛苦回应",
      "enabled": true,
      "triggers": [
        { "mode": "activity", "allow_activities": ["Slap","Bite","Spank"] },
        { "mode": "orgasm", "type": "Any" }
      ],
      "messages": [
        { "type": "message", "content": "嗷！" },
        { "type": "action", "content": "被抽打了一下" }
      ],
      "meta": { "intent": "当玩家粗暴对待我时", "marker": "已惩罚" }
    }
  ],
  "blackList": []
}`;

export function ImportPanel({ onLoaded }: ImportPanelProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [append, setAppend] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [debugPreview, setDebugPreview] = useState<string | null>(null);

  const doParse = (raw: string) => {
    setError(null);
    setInfo(null);
    setDebugPreview(null);
    // 优先尝试 AI 协作格式（Markdown / 注释 JSON），命中即返回；否则走 BC 压缩串 / 原始 JSON
    const ai = parseAIDoc(raw);
    const res: ImportResult = ai ?? parseInput(raw);
    if (!res.ok) {
      setError(res.error);
      if (res.debugPreview) setDebugPreview(res.debugPreview);
      return;
    }
    const kindText =
      res.kind === "settings"
        ? "全套设置"
        : res.kind === "personaArray"
        ? "人格数组"
        : "单人格";
    setInfo(`识别成功：类型=${kindText}，共 ${res.personas.length} 个人格`);
    onLoaded(res.personas, res.settings ?? null, append);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      setText(content);
      doParse(content);
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  return (
    <div className="panel">
      <h2>导入数据</h2>
      <p className="muted">
        支持从 BCResponsive 插件导出的<strong>压缩代码</strong>、<strong>原始 JSON</strong>、<strong>人格数组</strong>或
        <strong>全套设置</strong>导入；也支持本工具导出的<strong>AI 协作格式</strong>（Markdown / 注释 JSON）。
        粘贴到下方文本框，或选择本地文件（.json / .txt / .md）。
      </p>

      <label className="checkbox-row">
        <input type="checkbox" checked={append} onChange={(e) => setAppend(e.target.checked)} />
        追加到当前已编辑的数据（不勾选则替换当前所有人格）
      </label>

      <textarea
        className="code-area"
        value={text}
        placeholder={SAMPLE}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />

      <div className="row">
        <button className="btn primary" onClick={() => doParse(text)} disabled={!text.trim()}>
          解析并导入
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          选择文件…
        </button>
        <button className="btn ghost" onClick={() => { setText(""); setError(null); setInfo(null); }}>
          清空
        </button>
        <input ref={fileRef} type="file" accept=".json,.txt,text/plain" hidden onChange={onFile} />
      </div>

      {error && <div className="alert error">{error}</div>}
      {debugPreview && (
        <details className="help" open>
          <summary>🔍 解压后的原始内容（调试信息）</summary>
          <pre className="debug-preview">{debugPreview}</pre>
        </details>
      )}
      {info && <div className="alert success">{info}</div>}

      <details className="help">
        <summary>如何获取插件导出的数据？</summary>
        <ol>
          <li>在游戏内打开 BCResponsive 设置 → 人格设置 → 某人格的「导入/导出」。</li>
          <li>文本框里已是该人格的压缩代码，<strong>全选复制</strong>后粘贴到此处。</li>
          <li>本工具会解析它，供你批量编辑；编辑完再到「导出」页生成新的压缩代码，粘回插件确认即可。</li>
        </ol>
        <p className="muted">
          注：插件自带导出会丢弃「黑名单(blackList)」。本工具在导出时额外保留黑名单（插件导入也兼容），
          但经由插件再次导出时黑名单会按插件逻辑重置——这是插件自身限制。
        </p>
      </details>
    </div>
  );
}
