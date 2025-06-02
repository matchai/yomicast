import { downloadFile, extractDictionary, getLatestDictionaryUrl } from "./dictionary/download";
import { DOWNLOAD_PATH, DB_PATH, EXTRACT_PATH, SQLITE_WASM_PATH } from "./constants";
import { createTables, populateTables } from "./dictionary/populate";
import { showToast, Toast } from "@raycast/api";
import initSqlJs from "sql.js";
import fs from "node:fs";

let toast: Toast | null = null;
async function updateToast(options: Toast.Options) {
  if (toast) {
    toast.title = options.title || toast.title;
    toast.message = options.message || toast.message;
    toast.style = options.style || toast.style;
  } else {
    toast = await showToast({
      style: Toast.Style.Animated,
      ...options,
    });
  }
  return toast;
}

export default async function Command() {
  const isDownloaded = fs.existsSync(DOWNLOAD_PATH);
  if (!isDownloaded) {
    const toast = await updateToast({
      style: Toast.Style.Animated,
      title: "Downloading latest dictionary...",
      message: `Progress: 0%`,
    });

    const dictionaryUrl = await getLatestDictionaryUrl();

    if (!dictionaryUrl) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to find latest dictionary";
      toast.message = "Please try again later.";
      return;
    }
    await downloadFile(dictionaryUrl, DOWNLOAD_PATH, toast);
  }

  const isExtracted = fs.existsSync(EXTRACT_PATH);
  if (!isExtracted) {
    const toast = await updateToast({
      style: Toast.Style.Animated,
      title: "Extracting dictionary...",
      message: "",
    });

    await extractDictionary(DOWNLOAD_PATH, EXTRACT_PATH, toast);
  }

  const toast = await updateToast({
    style: Toast.Style.Animated,
    title: "Indexing database...",
    message: "",
  });

  const wasmBinary = fs.readFileSync(SQLITE_WASM_PATH);
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();

  console.log("Creating tables...");
  createTables(db);

  console.log("Populating dictionary...");
  const success = await populateTables(db, toast);
  if (success) {
    db.run("VACUUM;");
    await fs.promises.writeFile(DB_PATH, db.export());
  }

  db.close();
}
