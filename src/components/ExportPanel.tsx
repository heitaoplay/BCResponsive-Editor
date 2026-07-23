import { useState } from "react";
import { personaToLZString } from "../compat";
import type { ResponsivePersonality } from "../types";

interface ExportPanelProps {
  personas: ResponsivePersonality[];
}

export function ExportPanel({ personas }: ExportPanelProps) {
  const [selected, setSelected] = useState(0);
  const [format, setFormat] = useState<"lz" | "json">("lz");
  const [copied, setCopied] = useState(false);

  if (personas.length === 0) {
    return (
      <div className="panel">
        <h2>导出数据</h2>
        <div className="alert">当前没有任何人格数据。请先「导入」或从「编辑」页创建。</div>
      </div>
    );
  }

  const idx = Math.min(selected, personas.length - 1);
  const p = personas[idx];
  const output = format === "lz" ? personaToLZString(p) : JSON.stringify(p, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ext = format === "lz" ? "txt" : "json";
    a.href = url;
    a.download = `${p.name || "persona"}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel">
      <h2>导出数据</h2>
      <p className="muted">
        选择一个要导出的人格，生成可粘回插件「导入/导出」文本框的代码。导出默认保留<strong>黑名单(blackList)</strong>。
      </p>

      <div className="row wrap">
        <label className="field-label">人格：</label>
        <select value={idx} onChange={(e) => setSelected(Number(e.target.value))}>
          {personas.map((pp, i) => (
            <option key={i} value={i}>
              {i + 1}. {pp.name}（{pp.responses.length} 响应）
            </option>
          ))}
        </select>
        <label className="checkbox-row">
          格式：
          <select value={format} onChange={(e) => setFormat(e.target.value as "lz" | "json")}>
            <option value="lz">压缩代码（插件兼容）</option>
            <option value="json">原始 JSON（可读/备份）</option>
          </select>
        </label>
      </div>

      <textarea className="code-area" readOnly value={output} spellCheck={false} />

      <div className="row">
        <button className="btn primary" onClick={copy}>
          {copied ? "已复制 ✓" : "复制到剪贴板"}
        </button>
        <button className="btn" onClick={download}>
          下载文件
        </button>
      </div>

      <div className="alert success">
        把上面代码<strong>整段</strong>复制，回到游戏内插件对应人格的「导入/导出」框，清空原内容并粘贴，点确认即可。
      </div>
    </div>
  );
}
