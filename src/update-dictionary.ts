import { downloadFile, extractDictionary, getLatestDictionaryUrl } from "./dictionary/download";
import { loadDictionary } from "@scriptin/jmdict-simplified-loader";
import { environment, showToast, Toast } from "@raycast/api";
import path from "node:path";
import fs from "node:fs";
import { sql } from "./utils";
import initSqlJs from "sql.js";

const DOWNLOAD_PATH = path.join(environment.supportPath, "jmdict.json.zip");
const EXTRACT_PATH = path.join(environment.supportPath, "jmdict.json");
const DB_PATH = path.join(environment.supportPath, "jmdict.db");

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

    const dictionaryUrl = getLatestDictionaryUrl();
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

  await updateToast({
    style: Toast.Style.Animated,
    title: "Indexing database...",
    message: "",
  });

  const wasmBinary = fs.readFileSync(path.join(environment.assetsPath, "sql-wasm.wasm"));
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();

  console.log("Creating schema...");

  db.run(sql`
    DROP TABLE IF EXISTS entries;
    DROP TABLE IF EXISTS kanji_index;
    DROP TABLE IF EXISTS kana_index;
    -- DROP TABLE IF EXISTS gloss_fts_index;

    CREATE TABLE entries (
      entry_id INTEGER PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE kanji_index (
      kanji_text TEXT NOT NULL,
      entry_id INTEGER NOT NULL,
      PRIMARY KEY (kanji_text, entry_id),
      FOREIGN KEY (entry_id) REFERENCES entries(entry_id) ON DELETE CASCADE
    );
    CREATE INDEX idx_kanji_text_prefix ON kanji_index(kanji_text);

    CREATE TABLE kana_index (
      normalized_kana_text TEXT NOT NULL,
      entry_id INTEGER NOT NULL,
      PRIMARY KEY (normalized_kana_text, entry_id),
      FOREIGN KEY (entry_id) REFERENCES entries(entry_id) ON DELETE CASCADE
    );
    CREATE INDEX idx_kana_text_prefix ON kana_index(normalized_kana_text);

    -- CREATE VIRTUAL TABLE gloss_fts_index USING fts5(
    --   entry_id UNINDEXED,
    --   gloss_content,
    --   tokenize = 'unicode61'
    -- );
  `);

  await fs.promises.writeFile(DB_PATH, db.export());
  db.close();
}

//  async function Command() {
//   const toast = await showToast({
//     style: Toast.Style.Animated,
//     title: "Downloading latest dictionary...",
//     message: `Progress: 0%`,
//   });

//   if (!fs.existsSync(downloadPath)) {
//     const archivePath = await downloadFile(downloadUrl, downloadPath, toast);
//     if (!archivePath) {
//       toast.style = Toast.Style.Failure;
//       toast.title = "Failed to download dictionary";
//       toast.message = "Please try again later.";
//       return;
//     }
//   }

//   const dictPath = await extractDictionary(downloadPath, toast);
//   if (!dictPath) {
//     toast.style = Toast.Style.Failure;
//     toast.title = "Failed to extract dictionary";
//     toast.message = "Please try again later.";
//     return;
//   }

//   // Create a new database file if it doesn't exist
//   const db = new Database(dbPath, { verbose: console.log });
//   db.close();

//   await executeSQL(sql`CREATE TABLE IF NOT EXISTS word_senses (id INTEGER PRIMARY KEY, sense TEXT);`);

//   await new Promise((resolve, reject) => {
//     const loader = loadDictionary("jmdict", dictPath)
//       .onMetadata((metadata) => console.log("Metadata:", JSON.stringify(metadata, null, 2)))
//       .onEntry((entry) => {
//         executeSQL(sql`INSERT OR REPLACE INTO word_senses ("id", "sense") VALUES ("${entry.id}", "${entry.sense}");`);
//       })
//       .onEnd(() => {
//         toast.style = Toast.Style.Success;
//         toast.title = "Dictionary updated successfully";
//         toast.message = "You can now use the latest dictionary.";
//         resolve(null);
//       });

//     loader.parser.on("error", (error: unknown) => {
//       toast.style = Toast.Style.Failure;
//       toast.title = "Error loading dictionary";
//       console.log("Failed to parse dictionary:", error);
//       reject(error);
//     });
//   });
// }
