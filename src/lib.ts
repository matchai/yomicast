import { environment } from "@raycast/api";
import fsSync from "node:fs";
import path from "node:path";
import os from "node:os";

export const DICTIONARY_URL =
  "https://github.com/stephenmk/stephenmk.github.io/releases/latest/download/jitendex-yomitan.zip";

export const TEMP_DIR = fsSync.mkdtempSync(path.join(os.tmpdir(), "jitendex-mdict-"));
export const EXTRACTED_PATH = path.join(TEMP_DIR, "jitendex-yomitan");

export const DICTIONARY_PATH = path.join(environment.supportPath, "jitendex-mdict.mdx");
export const DB_PATH = path.join(environment.supportPath, "jitendex.db");

export function getDictionary() {}
