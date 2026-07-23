import { useEffect, useRef, useState } from "react";
import type {
  ResponseItem,
  ResponseMessage,
} from "../types";
import { newMessage } from "../compat";
import { move, removeAt } from "../ops";
import { TriggerEditor } from "./TriggerEditor";
import { ConfirmInline } from "./ConfirmInline";
import { useToast } from "./Toast";
import { MODE_META, summarizeTrigger } from "./triggerSummary";

interface ResponseCardProps {
  index: number;
  total: number;
  response: ResponseItem;
  autoFocusName?: boolean;
  onChange: (r: ResponseItem) => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: (name: string) => void;
  onAddResponse?: () => void;
  // 拖拽排序
  onDragStart: (i: number) => void;
  onDragEnter: (i: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isOver: boolean;
}

// 响应卡片：折叠态常驻摘要（模式图标 + 触发条件 + 消息数 + 校验警告），展开态内联编辑。
export function ResponseCard(props: ResponseCardProps) {
  const { index, total, response, onChange, onUp, onDown, onDelete } = props;
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [armed, setArmed] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const set = (patch: Partial<ResponseItem>) => onChange({ ...response, ...patch });

  const warn =
    (response.trigger.mode === "activity" &&
      (response.trigger as any).allow_activities?.length === 0) ||
    response.messages.length === 0;

  useEffect(() => {
    if (open && props.autoFocusName && nameRef.current) nameRef.current.focus();
  }, [open, props.autoFocusName]);

  const updateMessage = (mi: number, fn: (m: ResponseMessage) => ResponseMessage) =>
    set({ messages: response.messages.map((m, idx) => (idx === mi ? fn(m) : m)) });

  const summary = summarizeTrigger(response.trigger);

  return (
    <div
      className={`resp-card ${open ? "open" : ""} ${props.isDragging ? "dragging" : ""} ${
        props.isOver ? "drag-over" : ""
      }`}
      draggable={armed}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        props.onDragStart(index);
      }}
      onDragEnd={() => {
        setArmed(false);
        props.onDragEnd();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => props.onDragEnter(index)}
      data-rindex={index}
    >
      {/* 折叠态摘要 */}
      <div className="rc-summary" onClick={() => setOpen(true)}>
        <button
          type="button"
          className={`enable-dot ${response.enabled ? "on" : ""}`}
          aria-pressed={response.enabled}
          title={response.enabled ? "已启用（点击禁用）" : "已禁用（点击启用）"}
          onClick={(e) => {
            e.stopPropagation();
            set({ enabled: !response.enabled });
            toast.push(response.enabled ? "已禁用" : "已启用", "info");
          }}
        />
        <span className="rc-name">{response.name || "(未命名)"}</span>
        <span className="rc-trigger" title={summary}>
          <span className="rc-mode-ico">{MODE_META[response.trigger.mode].icon}</span>
          {summary}
        </span>
        <span className="rc-msg" title="消息数">💬{response.messages.length}</span>
        {warn && (
          <span className="badge warn" title="此响应当前不会被触发或无任何输出">
            ⚠ 不触发
          </span>
        )}
        <span className="rc-caret">{open ? "▾" : "▸"}</span>
      </div>

      {/* 展开态内联编辑 */}
      {open && (
        <div className="rc-edit">
          <input
            ref={nameRef}
            className="name-input"
            value={response.name}
            placeholder="响应名称"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => set({ name: e.target.value })}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                props.onAddResponse?.();
              }
            }}
          />

          <TriggerEditor trigger={response.trigger} onChange={(t) => set({ trigger: t })} />

          <div className="sub-head row between">
            <strong>消息（{response.messages.length}）</strong>
            <div className="row">
              <button
                type="button"
                className="btn small"
                disabled={index === 0}
                onClick={onUp}
                title="上移此响应"
              >
                ↑
              </button>
              <button
                type="button"
                className="btn small"
                disabled={index === total - 1}
                onClick={onDown}
                title="下移此响应"
              >
                ↓
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

          <button
            type="button"
            className="btn small primary"
            onClick={() => set({ messages: [...response.messages, newMessage()] })}
          >
            + 消息
          </button>

          <div className="rc-footer">
            <span
              className="drag-handle"
              title="拖拽排序"
              onPointerDown={() => setArmed(true)}
              onPointerUp={() => setArmed(false)}
            >
              ⠿
            </span>
            <span className="spacer" />
            {confirming ? (
              <ConfirmInline
                message="确认删除该响应？"
                onConfirm={() => {
                  onDelete(response.name);
                  setConfirming(false);
                }}
                onCancel={() => setConfirming(false)}
              />
            ) : (
              <button
                type="button"
                className="btn small danger"
                onClick={() => setConfirming(true)}
              >
                删除
              </button>
            )}
            <button type="button" className="btn small" onClick={() => setOpen(false)}>
              收起
            </button>
          </div>
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
  const ref = useRef<HTMLTextAreaElement>(null);
  const set = (patch: Partial<ResponseMessage>) => props.onChange({ ...message, ...patch });

  const insert = (tok: string) => {
    const ta = ref.current;
    if (!ta) {
      set({ content: message.content + tok });
      return;
    }
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const v = ta.value;
    set({ content: v.slice(0, s) + tok + v.slice(e) });
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = s + tok.length;
    });
  };

  return (
    <div className="msg-row">
      <div className="msg-tools">
        <div className="seg">
          <button
            type="button"
            className={`seg-btn ${message.type === "message" ? "on" : ""}`}
            aria-pressed={message.type === "message"}
            onClick={() => set({ type: "message" })}
          >
            消息
          </button>
          <button
            type="button"
            className={`seg-btn ${message.type === "action" ? "on" : ""}`}
            aria-pressed={message.type === "action"}
            title="动作：角色执行该行为（而非聊天文字）"
            onClick={() => set({ type: "action" })}
          >
            动作
          </button>
        </div>
        <button type="button" className="btn tiny" onClick={() => insert("{me}")} title="插入你的名字">
          {"{me}"}
        </button>
        <button type="button" className="btn tiny" onClick={() => insert("{other}")} title="插入对方名字">
          {"{other}"}
        </button>
        <span className="spacer" />
        <button type="button" className="btn tiny" disabled={index === 0} onClick={props.onUp} title="上移">
          ↑
        </button>
        <button type="button" className="btn tiny" disabled={index === total - 1} onClick={props.onDown} title="下移">
          ↓
        </button>
        <button type="button" className="btn tiny danger" onClick={props.onDelete} title="删除消息">
          删
        </button>
      </div>
      <textarea
        ref={ref}
        className="msg-text"
        value={message.content}
        placeholder={message.type === "action" ? "角色执行的动作描述…" : "回复文字…"}
        onChange={(e) => set({ content: e.target.value })}
      />
    </div>
  );
}
