import { Request } from "express";
import config from "../config";

export function safeValue<T>(...values: (T | null | undefined)[]): T | null {
  for (const v of values) {
    if (v) return v;
  }
  return null;
}

export function appUrl(req: Request): string {
  return `${req.protocol}://${req.get("host")}`;
}

export const debug = {
  log: (...m: unknown[]) => {
    if (config.isDev) console.log("[DEBUG]", ...m);
  },
  error: (...m: unknown[]) => {
    if (config.isDev) console.error("[DEBUG ERROR]", ...m);
  },
};
