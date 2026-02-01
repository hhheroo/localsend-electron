import type { Device } from "./device";

export interface Announcement {
  alias: string;
  version: string;
  deviceModel?: string
  deviceType: Device
  fingerprint: string;
  port: number;
  protocol: "http" | "https";
  download?: boolean;
  announce?: boolean;
  announcement?: boolean;
}
