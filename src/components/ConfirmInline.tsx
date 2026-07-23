interface ConfirmInlineProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// 行内删除确认，取代原生 confirm()：不打断心流，配合动效与 toast 使用。
export function ConfirmInline({
  message,
  confirmLabel = "删除",
  cancelLabel = "取消",
  onConfirm,
  onCancel,
}: ConfirmInlineProps) {
  return (
    <span className="confirm-inline" role="alert">
      <span className="confirm-text">{message}</span>
      <button type="button" className="btn tiny ghost" onClick={onCancel}>
        {cancelLabel}
      </button>
      <button type="button" className="btn tiny danger" onClick={onConfirm} autoFocus>
        {confirmLabel}
      </button>
    </span>
  );
}
