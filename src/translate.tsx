import fs from "node:fs";
import { DB_PATH, SQLITE_WASM_PATH } from "./constants";
import { useEffect, useMemo, useState } from "react";
import initSqlJs, { Database } from "sql.js";
import { Action, ActionPanel, List } from "@raycast/api";
import { normalizeKana } from "./utils";
import { isJapanese, isKana } from "wanakana";
import { searchEnglish, searchKana, searchKanji } from "./dictionary/search";
import { JMdictWord } from "@scriptin/jmdict-simplified-types";

type FormattedKanjiItem = {
  id: string;
  kana: string;
  kanji?: string;
  definition?: string;
  detail: string;
};

let db: Database | undefined;
async function getDb() {
  if (db) return db;

  // Start promises in parallel
  const readWasm = fs.promises.readFile(SQLITE_WASM_PATH);
  const readDb = fs.promises.readFile(DB_PATH);

  const SQL = await initSqlJs({ wasmBinary: await readWasm });
  db = new SQL.Database(await readDb);
  return db;
}

function search(db: Database, query: string) {
  const japaneseQuery = normalizeKana(query);
  if (!isJapanese(japaneseQuery)) {
    console.time(`searchEnglish ${query}`);
    const def = searchEnglish(db, query);
    console.timeEnd(`searchEnglish ${query}`);
    return def;
  }

  // TODO: Mixed kanji-kana searches as kanji FTS

  if (isKana(japaneseQuery)) {
    return searchKana(db, japaneseQuery);
  }

  return searchKanji(db, japaneseQuery);
}

function formatKanjiItem(item: JMdictWord, db: Database): FormattedKanjiItem {
  const kanji = item.kanji.at(0)?.text;
  const kana = item.kana.at(0)?.text || "No kana";
  const definition = item.sense.at(0)?.gloss.at(0)?.text;
  const detail = `## ${kanji || kana}
  ${item.sense
    .map((sense) => {
      return `### ${sense.partOfSpeech.map((pos) => simplifyPartOfSpeech(pos, db)).join(", ")}
${sense.gloss.map((gloss) => `1. ${gloss.text}`).join("\n")}`;
    })
    .join("\n\n")}`;

  return {
    id: item.id,
    kanji,
    kana,
    definition,
    detail,
  };
}

function simplifyPartOfSpeech(pos: string, db: Database) {
  const getPosMap = db.exec("SELECT value from metadata WHERE key = ? LIMIT 1", ["tags"]);
  const posMap = JSON.parse((getPosMap.at(0)?.values.at(0)?.at(0) as string) ?? "{}");

  // Override values where the database's are too verbose
  switch (pos) {
    case "n":
      return "Noun";
  }

  return posMap[pos];
}

export default function Command() {
  const [db, setDb] = useState<Database>();
  const [query, setQuery] = useState("");
  const [showingDetail, setShowingDetail] = useState(false);

  useEffect(() => {
    getDb().then((db) => setDb(db));
    return () => db?.close();
  }, []);

  const results = useMemo(() => {
    if (!db || query.trim() === "") return [];
    const res = search(db, query);
    return res;
  }, [db, query]);

  const formattedData = results.map((item) => formatKanjiItem(item, db!));

  return (
    <List
      navigationTitle="Translate Japanese"
      searchBarPlaceholder="Search Yomicast..."
      searchText={query}
      onSearchTextChange={setQuery}
      isShowingDetail={showingDetail}
    >
      {formattedData.map((item) => (
        <List.Item
          key={item.id}
          title={item.kanji ?? item.kana}
          subtitle={item.kanji && !showingDetail ? item.kana : undefined}
          accessories={[{ text: item.definition }]}
          detail={<List.Item.Detail markdown={item.detail} />}
          actions={
            <ActionPanel>
              <Action title="Toggle Detail" onAction={() => setShowingDetail(!showingDetail)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
