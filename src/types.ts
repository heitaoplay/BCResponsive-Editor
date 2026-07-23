// 与 BCResponsive 插件数据模型完全对齐的类型定义
// 参考插件源码：src/Data/types.ts, src/Data/V2.ts, src/GUI/Persona/PersonaCompress.ts

export type ResponseTriggerMode = "activity" | "orgasm" | "spicer" | "event";

export type OrgasmTriggerType = "Orgasmed" | "Ruined" | "Resisted" | "Any";

export type ResponseMessageType = "message" | "action";

export interface ResponsiveTriggerActivity {
  mode: "activity";
  allow_activities?: string[] | null; // undefined = 全部活动；[] = 不触发任何
  allow_bodyparts?: string[] | null; // undefined = 全部部位
  allow_ids?: number[] | null; // undefined = 全部成员
}

export interface ResponsiveTriggerOrgasm {
  mode: "orgasm";
  type: OrgasmTriggerType;
}

export interface ResponsiveTriggerSpicer {
  mode: "spicer";
  min_arousal?: number | null;
  max_arousal?: number | null;
  apply_favorite?: boolean | null;
  allow_ids?: number[] | null;
}

export interface ResponsiveTriggerRoomEvent {
  mode: "event";
  event: "Join" | "Leave";
}

export type ResponseTrigger =
  | ResponsiveTriggerActivity
  | ResponsiveTriggerOrgasm
  | ResponsiveTriggerSpicer
  | ResponsiveTriggerRoomEvent;

export interface ResponseMessage {
  type: ResponseMessageType;
  content: string;
}

// AI 协作元数据：仅用于网站/外部 AI 之间流转的描述性信息，
// 不会进入 BC 插件执行逻辑（BC 只认 trigger + messages）。
export interface ResponseMeta {
  intent?: string; // 触发意图的自然语言描述（如「当玩家对我点头时」）
  state?: string; // 期望的状态变更描述（元数据，非 BC 执行）
  marker?: string; // 标记信息描述（元数据，非 BC 执行）
}

export interface ResponseItem {
  name: string;
  enabled: boolean;
  triggers: ResponseTrigger[]; // 1..N；导出 BC 时多触发降级为多响应（同名）
  messages: ResponseMessage[];
  meta?: ResponseMeta; // AI 协作元数据（不进 BC 执行）
}

export interface ResponsivePersonality {
  name: string;
  index: number;
  responses: ResponseItem[];
  blackList: number[];
}

export interface ResponsiveSettingV2 {
  settings: { enabled: boolean };
  active_personality: number | null;
  personalities: (ResponsivePersonality | null | undefined)[];
}
