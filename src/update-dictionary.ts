import { downloadFile, extractDictionary, getLatestDictionaryUrl } from "./dictionary/download";
import { DOWNLOAD_PATH, DB_PATH, EXTRACT_PATH, SQLITE_WASM_PATH } from "./constants";
import { loadDictionary } from "@scriptin/jmdict-simplified-loader";
import { showToast, Toast } from "@raycast/api";
import fs from "node:fs";
import { sql } from "./utils";
import initSqlJs, { Database } from "sql.js";
import wanakana from "wanakana";

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

  const wasmBinary = fs.readFileSync(SQLITE_WASM_PATH);
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();

  console.log("Creating tables...");
  createTables(db);

  console.log("Loading dictionary...");
  await new Promise<void>((resolve, reject) => {
    let count = 0;
    const total = 212062; // TODO: Get the total number from somewhere more reliable
    const loader = loadDictionary("jmdict", EXTRACT_PATH).onMetadata((metadata) => {
      db.run(
        sql`INSERT OR REPLACE INTO metadata (key, value) VALUES ('version', :version), ('date', :date), ('tags', :tags);`,
        {
          ":version": metadata.version,
          ":date": metadata.dictDate,
          ":tags": JSON.stringify(metadata.tags),
        },
      );
    });
    loader.onEntry((entry) => {
      db.run("BEGIN TRANSACTION;");
      // Insert full entry data
      db.run(sql`INSERT OR REPLACE INTO entries (entry_id, data) VALUES (:entry_id, :data);`, {
        ":entry_id": entry.id,
        ":data": JSON.stringify(entry),
      });

      // Insert kanji
      entry.kanji.forEach((kanji) => {
        db.run(sql`INSERT OR REPLACE INTO kanji_index (kanji_text, entry_id) VALUES (:kanji_text, :entry_id);`, {
          ":kanji_text": kanji.text,
          ":entry_id": entry.id,
        });
      });

      // Insert normalized kana
      entry.kana.forEach((kana) => {
        db.run(
          sql`INSERT OR REPLACE INTO kana_index (normalized_kana_text, entry_id) VALUES (:kana_text, :entry_id);`,
          {
            ":kana_text": wanakana.toHiragana(kana.text, {
              // Don't convert long vowel marks to hiragana
              // (e.g. ケーキ -> けえき. Instead, it should be けーき)
              convertLongVowelMark: false,
            }),
            ":entry_id": entry.id,
          },
        );
      });
      db.run("COMMIT;");

      count += 1;
      if (count % 1000 === 0) {
        updateToast({
          title: "Indexing database...",
          message: `Progress: ${Math.round((count / total) * 100)}%`,
          style: Toast.Style.Animated,
        });
      }
    });
    loader.onEnd(() => {
      console.log(`Indexed ${count} entries.`);
      console.log("Dictionary loaded successfully.");
      resolve();
    });
    loader.parser.on("error", (error: unknown) => {
      console.error("Failed to parse dictionary:", error);
      reject(error);
    });
  });

  await fs.promises.writeFile(DB_PATH, db.export());
  db.close();
}

function createTables(db: Database) {
  return db.run(sql`
    DROP TABLE IF EXISTS metadata;
    DROP TABLE IF EXISTS entries;
    DROP TABLE IF EXISTS kanji_index;
    DROP TABLE IF EXISTS kana_index;
    DROP TABLE IF EXISTS gloss_fts_index;

    CREATE TABLE metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

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

    CREATE VIRTUAL TABLE gloss_fts_index USING fts5(
      entry_id UNINDEXED,
      gloss_content,
      tokenize = 'unicode61'
    );
  `);
}
