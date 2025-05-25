/* eslint-disable @typescript-eslint/no-explicit-any */
import { showToast, Toast } from "@raycast/api";

/** A throttled version of showToast that waits 1 second before showing the toast. */
export function throttledShowToast(options: Toast.Options): Promise<Toast>;
export function throttledShowToast(style: Toast.Style, title: string, message?: string): Promise<Toast>;
export function throttledShowToast(...args: any[]): Promise<Toast> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve((showToast as any)(...args));
    }, 1000);
  });
}
