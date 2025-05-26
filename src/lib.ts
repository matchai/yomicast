import { environment } from "@raycast/api";
import { MDX } from "js-mdict";
import fsSync from "node:fs";
import path from "node:path";
import os from "node:os";

export const DOWNLOAD_PATH = path.join(
  fsSync.mkdtempSync(path.join(os.tmpdir(), "jitendex-mdict-")),
  "jitendex-mdict.zip",
);
export const DICTIONARY_PATH = path.join(environment.supportPath, "jitendex-mdict.mdx");

export function isDictionaryReady() {
  return fsSync.existsSync(DICTIONARY_PATH);
}

let mdict: MDX | null = null;

export function getDictionary() {
  if (!mdict) {
    mdict = new MDX(DICTIONARY_PATH, {});
  }
  return mdict;
}
