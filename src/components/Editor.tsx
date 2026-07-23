import { useState } from "react";
import type {
  ResponsivePersonality,
  ResponseItem,
  ResponseTrigger,
  ResponseTriggerMode,
  ResponseMessage,
  OrgasmTriggerType,
} from "../types";
import { newResponse, newMessage } from "../compat";
import { move, removeAt } from "../ops";
import { TagPicker } from "./TagPicker";
import { NumberList } from "./NumberList";
import { ALL_ACTIVITIES, ACTIVITY_CATEGORIES, BODYPARTS } from "../data";

interface EditorProps {
  personas: ResponsivePersonality[];
  setPersonas: (p: ResponsivePersonality[]) => void;
}

export function Editor({ personas, setPersonas }: EditorProps) {
  const [openP, setOpenP] = useState<number | null>(0);

  const updatePersona = (i: number, fn: (p: ResponsivePersonality) => ResponsivePersonality) =>
    setPersonas(personas.map((p, idx) => (idx === i ? fn(p) : p)));

  const addPersona = () => {
    const np = { name: "新人格", index: personas.length, responses: [], blackList: [] };
    setPersonas([...personas, np]);
    setOpenP(personas.length);
  };

  const duplicatePersona = (i: number) => {
    const src = personas[i];
    const copy: ResponsivePersonality = JSON.parse(JSON.stringify(src));
    copy.name = `${src.name} 副本`;
    copy.index = personas.length;
    setPersonas([...personas, copy]);
    setOpenP(personas.length);
  };

  return (
    <div className="panel">
      <div className="row between">
        <h2>编辑人格与动作</h2>
        <button className="btn primary" onClick={addPersona}>
          + 新建人格
        </button>
      </div>
      <p className="muted">点击人格卡片展开，可编辑其响应（动作）与消息；支持上/下移排序、删除、复制。</p>

      {personas.length === 0 && (
        <div className="alert">暂无人格。点「新建人格」从零开始，或到「导入」页载入插件数据。</div>
      )}

      {personas.map((p, i) => (
        <PersonaCard
          key={i}
          index={i}
          persona={p}
          open={openP === i}
          onToggle={() => setOpenP(openP === i ? null : i)}
          onUp={() => setPersonas(move(personas, i, i - 1))}
          onDown={() => setPersonas(move(personas, i, i + 1))}
          onDelete={() => {
            if (confirm(`确定删除人格「${p.name}」？`)) setPersonas(removeAt(personas, i));
          }}
          onDuplicate={() => duplicatePersona(i)}
          onChange={(np) => updatePersona(i, () => np)}
        />
      ))}
    </div>
  );
}

/* ----------------------------- 人格卡片 ----------------------------- */
function PersonaCard(props: {
  index: number;
  persona: ResponsivePersonality;
  open: boolean;
  onToggle: () => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onChange: (p: ResponsivePersonality) => void;
}) {
  const { index, persona, open } = props;
  const set = (patch: Partial<ResponsivePersonality>) =>
    props.onChange({ ...persona, ...patch });

  const updateResponse = (ri: number, fn: (r: ResponseItem) => ResponseItem) =>
    set({ responses: persona.responses.map((r, idx) => (idx === ri ? fn(r) : r)) });

  return (
    <div className="card persona-card">
      <div className="card-head" onClick={props.onToggle}>
        <span className="caret">{open ? "▾" : "▸"}</span>
        <input
          className="name-input"
          value={persona.name}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => set({ name: e.target.value })}
        />
        <span className="badge">{persona.responses.length} 响应</span>
        <span className="badge gray">黑名单 {persona.blackList.length}</span>
      </div>

      {open && (
        <div className="card-body">
          <NumberList
            label="触发成员 ID 黑名单 (blackList)"
            value={persona.blackList}
            onChange={(v) => set({ blackList: v ?? [] })}
          />

          <div className="row between sub-head">
            <strong>响应（动作）列表</strong>
            <div className="row">
              <button className="btn small" onClick={props.onUp} disabled={index === 0}>
                ↑ 上移
              </button>
              <button
                className="btn small"
                onClick={props.onDown}
                disabled={index === persona.responses.length - 1 && false}
              >
                ↓ 下移
              </button>
              <button className="btn small" onClick={props.onDuplicate}>
                复制
              </button>
              <button className="btn small danger" onClick={props.onDelete}>
                删除人格
              </button>
              <button
                className="btn small primary"
                onClick={() =>
                  set({ responses: [...persona.responses, newResponse()] })
                }
              >
                + 新响应
              </button>
            </div>
          </div>

          {persona.responses.length === 0 && (
            <div className="alert">该人格还没有响应，点「+ 新响应」添加。</div>
          )}

          {persona.responses.map((r, ri) => (
            <ResponseCard
              key={ri}
              index={ri}
              total={persona.responses.length}
              response={r}
              onChange={(nr) => updateResponse(ri, () => nr)}
              onUp={() =>
                set({ responses: move(persona.responses, ri, ri - 1) })
              }
              onDown={() =>
                set({ responses: move(persona.responses, ri, ri + 1) })
              }
              onDelete={() => set({ responses: removeAt(persona.responses, ri) })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- 响应卡片 ----------------------------- */
function ResponseCard(props: {
  index: number;
  total: number;
  response: ResponseItem;
  onChange: (r: ResponseItem) => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) {
  const { index, response, total } = props;
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<ResponseItem>) => props.onChange({ ...response, ...patch });

  const warn =
    (response.trigger.mode === "activity" &&
      (response.trigger as any).allow_activities?.length === 0) ||
    response.messages.length === 0;

  const updateMessage = (mi: number, fn: (m: ResponseMessage) => ResponseMessage) =>
    set({ messages: response.messages.map((m, idx) => (idx === mi ? fn(m) : m)) });

  return (
    <div className="card response-card">
      <div className="card-head" onClick={() => setOpen(!open)}>
        <span className="caret">{open ? "▾" : "▸"}</span>
        <input
          className="name-input"
          value={response.name}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => set({ name: e.target.value })}
        />
        <label className="switch-inline" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={response.enabled}
            onChange={(e) => set({ enabled: e.target.checked })}
          />
          启用
        </label>
        {warn && <span className="badge warn">⚠ 可能不触发</span>}
      </div>

      {open && (
        <div className="card-body">
          <TriggerEditor
            trigger={response.trigger}
            onChange={(t) => set({ trigger: t })}
          />

          <div className="row between sub-head">
            <strong>消息（{response.messages.length}）</strong>
            <div className="row">
              <button className="btn small" onClick={props.onUp} disabled={index === 0}>
                ↑
              </button>
              <button
                className="btn small"
                onClick={props.onDown}
                disabled={index === total - 1}
              >
                ↓
              </button>
              <button className="btn small danger" onClick={props.onDelete}>
                删除
              </button>
              <button
                className="btn small primary"
                onClick={() => set({ messages: [...response.messages, newMessage()] })}
              >
                + 消息
              </button>
            </div>
          </div>

          {response.messages.map((m, mi) => (
            <MessageRow
              key={mi}
              index={mi}
              total={response.messages.length}
              message={m}
              onChange={(nm) => updateMessage(mi, () => nm)}
              onUp={() => set({ messages: move(response.messages, mi, mi - 1) })}
              onDown={() => set({ messages: move(response.messages, mi, mi + 1) })}
              onDelete={() => set({ messages: removeAt(response.messages, mi) })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- 触发器编辑 ----------------------------- */
function TriggerEditor({
  trigger,
  onChange,
}: {
  trigger: ResponseTrigger;
  onChange: (t: ResponseTrigger) => void;
}) {
  const mode = trigger.mode;
  const setMode = (m: ResponseTriggerMode) => {
    if (m === "activity") onChange({ mode: "activity", allow_activities: undefined });
    else if (m === "orgasm") onChange({ mode: "orgasm", type: "Any" });
    else if (m === "spicer")
      onChange({ mode: "spicer", min_arousal: undefined, max_arousal: undefined, apply_favorite: undefined, allow_ids: undefined });
    else onChange({ mode: "event", event: "Join" });
  };

  return (
    <div className="trigger-editor">
      <div className="field">
        <span className="field-label">触发模式</span>
        <select value={mode} onChange={(e) => setMode(e.target.value as ResponseTriggerMode)}>
          <option value="activity">互动活动 (Activity)</option>
          <option value="orgasm">高潮 (Orgasm)</option>
          <option value="spicer">兴奋度 (Spicer)</option>
          <option value="event">进出聊天 (Event)</option>
        </select>
      </div>

      {mode === "activity" && (
        <>
          <TagPicker
            label="触发活动 (allow_activities)"
            value={(trigger as any).allow_activities}
            suggestions={ALL_ACTIVITIES}
            allHint="留空=全部活动；若选择若干项则仅这些活动触发。"
            onChange={(v) => onChange({ mode: "activity", ...(trigger as any), allow_activities: v })}
          />
          <TagPicker
            label="触发身体部位 (allow_bodyparts)"
            value={(trigger as any).allow_bodyparts}
            suggestions={BODYPARTS.map((b) => b.value)}
            allHint="留空=全部部位。"
            onChange={(v) => onChange({ mode: "activity", ...(trigger as any), allow_bodyparts: v })}
          />
          <NumberList
            label="限制成员 ID (allow_ids)"
            value={(trigger as any).allow_ids}
            onChange={(v) => onChange({ mode: "activity", ...(trigger as any), allow_ids: v })}
          />
          <details className="help">
            <summary>按分类快速选择活动</summary>
            <div className="cat-grid">
              {ACTIVITY_CATEGORIES.map((c) => (
                <div key={c.label} className="cat">
                  <div className="cat-label">{c.label}</div>
                  <div className="cat-items">
                    {c.items.map((it) => {
                      const cur = (trigger as any).allow_activities ?? [];
                      const on = cur.includes(it);
                      return (
                        <button
                          key={it}
                          className={`chip ${on ? "on" : ""}`}
                          onClick={() => {
                            const next = on
                              ? cur.filter((x: string) => x !== it)
                              : [...cur, it];
                            onChange({
                              mode: "activity",
                              ...(trigger as any),
                              allow_activities: next,
                            });
                          }}
                        >
                          {it}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </>
      )}

      {mode === "orgasm" && (
        <div className="field">
          <span className="field-label">高潮类型</span>
          <select
            value={(trigger as any).type}
            onChange={(e) => onChange({ mode: "orgasm", type: e.target.value as OrgasmTriggerType })}
          >
            <option value="Any">任意 (Any)</option>
            <option value="Orgasmed">达到高潮 (Orgasmed)</option>
            <option value="Ruined">被破坏高潮 (Ruined)</option>
            <option value="Resisted">忍住 (Resisted)</option>
          </select>
        </div>
      )}

      {mode === "spicer" && (
        <>
          <div className="field two">
            <label>
              最低兴奋度
              <input
                type="number"
                min={0}
                max={100}
                value={(trigger as any).min_arousal ?? ""}
                placeholder="0"
                onChange={(e) =>
                  onChange({
                    mode: "spicer",
                    ...(trigger as any),
                    min_arousal: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              最高兴奋度
              <input
                type="number"
                min={0}
                max={100}
                value={(trigger as any).max_arousal ?? ""}
                placeholder="100"
                onChange={(e) =>
                  onChange({
                    mode: "spicer",
                    ...(trigger as any),
                    max_arousal: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
          <label className="switch-inline">
            <input
              type="checkbox"
              checked={!!(trigger as any).apply_favorite}
              onChange={(e) =>
                onChange({
                  mode: "spicer",
                  ...(trigger as any),
                  apply_favorite: e.target.checked,
                })
              }
            />
            仅对偏好对象生效 (apply_favorite)
          </label>
          <NumberList
            label="限制成员 ID (allow_ids)"
            value={(trigger as any).allow_ids}
            onChange={(v) => onChange({ mode: "spicer", ...(trigger as any), allow_ids: v })}
          />
        </>
      )}

      {mode === "event" && (
        <div className="field">
          <span className="field-label">事件类型</span>
          <select
            value={(trigger as any).event}
            onChange={(e) => onChange({ mode: "event", event: e.target.value as "Join" | "Leave" })}
          >
            <option value="Join">加入聊天 (Join)</option>
            <option value="Leave">离开聊天 (Leave)</option>
          </select>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- 消息行 ----------------------------- */
function MessageRow(props: {
  index: number;
  total: number;
  message: ResponseMessage;
  onChange: (m: ResponseMessage) => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) {
  const { index, message, total } = props;
  const set = (patch: Partial<ResponseMessage>) => props.onChange({ ...message, ...patch });
  const insert = (tok: string) => {
    const ta = document.activeElement as HTMLTextAreaElement;
    // 简单附加到末尾（多数浏览器 activeElement 即该 textarea）
    if (ta && ta.tagName === "TEXTAREA" && ta.dataset.mid === String(index)) {
      const s = ta.selectionStart;
      const e = ta.selectionEnd;
      const v = ta.value;
      const next = v.slice(0, s) + tok + v.slice(e);
      set({ content: next });
      return;
    }
    set({ content: message.content + tok });
  };

  return (
    <div className="msg-row">
      <div className="msg-tools">
        <div className="seg">
          <button
            className={`seg-btn ${message.type === "message" ? "on" : ""}`}
            onClick={() => set({ type: "message" })}
          >
            消息
          </button>
          <button
            className={`seg-btn ${message.type === "action" ? "on" : ""}`}
            onClick={() => set({ type: "action" })}
            title="动作：角色执行该行为（而非聊天文字）"
          >
            动作
          </button>
        </div>
        <button className="btn tiny" onClick={() => insert("{me}")} title="插入你的名字">
          {`{me}`}
        </button>
        <button className="btn tiny" onClick={() => insert("{other}")} title="插入对方名字">
          {`{other}`}
        </button>
        <span className="spacer" />
        <button className="btn tiny" onClick={props.onUp} disabled={index === 0}>
          ↑
        </button>
        <button className="btn tiny" onClick={props.onDown} disabled={index === total - 1}>
          ↓
        </button>
        <button className="btn tiny danger" onClick={props.onDelete}>
          删
        </button>
      </div>
      <textarea
        className="msg-text"
        data-mid={index}
        value={message.content}
        placeholder={message.type === "action" ? "角色执行的动作描述…" : "回复文字…"}
        onChange={(e) => set({ content: e.target.value })}
      />
    </div>
  );
}
