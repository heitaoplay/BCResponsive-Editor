import { useState } from "react";
import type { ResponsivePersonality, ResponsiveSettingV2 } from "./types";
import { ImportPanel } from "./components/ImportPanel";
import { Editor } from "./components/Editor";
import { MergePanel } from "./components/MergePanel";
import { ExportPanel } from "./components/ExportPanel";

type Tab = "import" | "editor" | "merge" | "export";

const TABS: { key: Tab; label: string }[] = [
  { key: "import", label: "导入" },
  { key: "editor", label: "编辑" },
  { key: "merge", label: "合并" },
  { key: "export", label: "导出" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("import");
  const [personas, setPersonas] = useState<ResponsivePersonality[]>([]);
  const [settings, setSettings] = useState<ResponsiveSettingV2 | null>(null);

  const onLoaded = (
    loaded: ResponsivePersonality[],
    s: ResponsiveSettingV2 | null,
    appended: boolean
  ) => {
    if (appended && personas.length > 0) {
      // 追加并重新编号 index
      const base = personas.length;
      const reindexed = loaded.map((p, i) => ({ ...p, index: base + i }));
      setPersonas([...personas, ...reindexed]);
    } else {
      const reindexed = loaded.map((p, i) => ({ ...p, index: i }));
      setPersonas(reindexed);
    }
    if (s) setSettings(s);
    setTab("editor");
  };

  const exportAllJson = () => {
    const blob = new Blob([JSON.stringify(personas, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bcresponsive-personas.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">BC</span>
          <div>
            <div className="title">BCResponsive 编辑器</div>
            <div className="subtitle">动作与人格 · 批量编辑 · 纯前端</div>
          </div>
        </div>
        <div className="top-actions">
          <span className="count-badge">{personas.length} 人格</span>
          <button className="btn ghost small" onClick={exportAllJson} disabled={personas.length === 0}>
            全部导出 JSON
          </button>
          <button
            className="btn ghost small"
            onClick={() => {
              if (confirm("清空当前所有编辑数据？")) {
                setPersonas([]);
                setSettings(null);
              }
            }}
            disabled={personas.length === 0}
          >
            清空
          </button>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "on" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === "import" && <ImportPanel onLoaded={onLoaded} />}
        {tab === "editor" && <Editor personas={personas} setPersonas={setPersonas} />}
        {tab === "merge" && <MergePanel personas={personas} setPersonas={setPersonas} />}
        {tab === "export" && <ExportPanel personas={personas} />}
      </main>

      <footer className="footer">
        数据仅在本浏览器内处理，不会上传任何服务器。与 BCResponsive 插件的压缩代码格式双向兼容。
      </footer>
    </div>
  );
}
