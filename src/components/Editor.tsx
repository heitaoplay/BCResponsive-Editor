import { useState } from "react";
import type { ResponsivePersonality } from "../types";
import { newPersona } from "../compat";
import { move } from "../ops";
import { ToastProvider, useToast } from "./Toast";
import { PersonaRail } from "./PersonaRail";
import { ResponseWorkspace } from "./ResponseWorkspace";

interface EditorProps {
  personas: ResponsivePersonality[];
  setPersonas: (p: ResponsivePersonality[]) => void;
}

function EditorInner({ personas, setPersonas }: EditorProps) {
  const toast = useToast();
  const [selected, setSelected] = useState(0);

  const clamped = personas.length ? Math.min(Math.max(selected, 0), personas.length - 1) : -1;
  const current = clamped >= 0 ? personas[clamped] : null;

  const updatePersona = (i: number, fn: (p: ResponsivePersonality) => ResponsivePersonality) =>
    setPersonas(personas.map((p, idx) => (idx === i ? fn(p) : p)));

  const addPersona = () => {
    const np = newPersona(personas.length);
    setPersonas([...personas, np]);
    setSelected(personas.length);
    toast.push("已新建人格", "success");
  };

  const duplicatePersona = (i: number) => {
    const src = personas[i];
    const copy: ResponsivePersonality = JSON.parse(JSON.stringify(src));
    copy.name = `${src.name} 副本`;
    copy.index = personas.length;
    setPersonas([...personas, copy]);
    setSelected(personas.length);
    toast.push("已复制人格", "success");
  };

  const deletePersona = (i: number) => {
    const name = personas[i]?.name ?? "";
    setPersonas(personas.filter((_, idx) => idx !== i));
    setSelected(Math.max(0, Math.min(i, personas.length - 2)));
    toast.push(`已删除人格「${name || "(未命名)"}」`, "warn");
  };

  const reorderPersona = (from: number, to: number) => {
    setPersonas(move(personas, from, to));
  };

  return (
    <div className="panel editor-panel">
      {personas.length === 0 ? (
        <div className="editor-empty">
          <div className="alert">
            暂无人格。点下方按钮从零开始，或到「导入」页载入插件数据。
          </div>
          <button type="button" className="btn primary" onClick={addPersona}>
            + 新建人格
          </button>
        </div>
      ) : (
        <div className="editor-layout">
          <PersonaRail
            personas={personas}
            selected={clamped}
            onSelect={setSelected}
            onAdd={addPersona}
            onDuplicate={duplicatePersona}
            onDelete={deletePersona}
            onReorder={reorderPersona}
          />
          {current && (
            <ResponseWorkspace
              key={clamped}
              persona={current}
              onChange={(np) => updatePersona(clamped, () => np)}
              onDuplicatePersona={() => duplicatePersona(clamped)}
              onDeletePersona={() => deletePersona(clamped)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function Editor(props: EditorProps) {
  return (
    <ToastProvider>
      <EditorInner {...props} />
    </ToastProvider>
  );
}
