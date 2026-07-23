import type {
  ResponseTrigger,
  ResponseTriggerMode,
  OrgasmTriggerType,
} from "../types";
import { TagPicker } from "./TagPicker";
import { NumberList } from "./NumberList";
import { ActivityPicker } from "./ActivityPicker";
import { MODE_META } from "./triggerSummary";

interface TriggerEditorProps {
  trigger: ResponseTrigger;
  onChange: (t: ResponseTrigger) => void;
}

const MODES: ResponseTriggerMode[] = ["activity", "orgasm", "spicer", "event"];

const BODYPART_SUGGESTIONS = [
  "ItemArms", "ItemLegs", "ItemFeet", "ItemHands", "ItemMouth", "ItemBreast",
  "ItemTorso", "ItemVulva", "ItemButt", "ItemAnal", "ItemPenis", "ItemNeck",
  "ItemHead", "ItemHair",
];

// 紧凑版触发器编辑：四段 segmented 控件 + 各模式精简字段。
export function TriggerEditor({ trigger, onChange }: TriggerEditorProps) {
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
      <div className="seg mode-seg" role="group" aria-label="触发模式">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            className={`seg-btn ${mode === m ? "on" : ""}`}
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
          >
            <span className="seg-ico">{MODE_META[m].icon}</span>
            {MODE_META[m].label}
          </button>
        ))}
      </div>

      {mode === "activity" && (
        <>
          <ActivityPicker
            label="触发活动 (allow_activities)"
            value={(trigger as any).allow_activities}
            allHint="留空=全部活动；若选择若干项则仅这些活动触发；选「无」= 不触发任何。"
            onChange={(v) => onChange({ mode: "activity", ...(trigger as any), allow_activities: v })}
          />
          <TagPicker
            label="触发身体部位 (allow_bodyparts)"
            value={(trigger as any).allow_bodyparts}
            suggestions={BODYPART_SUGGESTIONS}
            allHint="留空=全部部位。"
            onChange={(v) => onChange({ mode: "activity", ...(trigger as any), allow_bodyparts: v })}
          />
          <NumberList
            label="限制成员 ID (allow_ids)"
            value={(trigger as any).allow_ids}
            onChange={(v) => onChange({ mode: "activity", ...(trigger as any), allow_ids: v })}
          />
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
