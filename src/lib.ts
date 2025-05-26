import { environment } from "@raycast/api";
import { MDX } from "js-mdict";
import fsSync from "node:fs";
import path from "node:path";
import os from "node:os";

export const DICTIONARY_URL =
  "https://github.com/stephenmk/stephenmk.github.io/releases/latest/download/jitendex-mdict.zip";

export const DOWNLOAD_PATH = path.join(
  fsSync.mkdtempSync(path.join(os.tmpdir(), "jitendex-mdict-")),
  "jitendex-mdict.zip",
);
export const DICTIONARY_PATH = path.join(environment.supportPath, "jitendex-mdict.mdx");
export const DB_PATH = path.join(environment.supportPath, "jitendex.db");

export function getDictionary() {}
