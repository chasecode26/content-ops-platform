export type PlatformCode =
  | "WECHAT_OFFICIAL"
  | "XIAOHONGSHU"
  | "DOUYIN"
  | "TOUTIAO";

export interface AdapterHealthcheckResult {
  platform: PlatformCode;
  ok: boolean;
  message?: string;
}
