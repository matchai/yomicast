import { JMdictWord } from "@scriptin/jmdict-simplified-types";
import { DB_PATH, SQLITE_WASM_PATH } from "./constants";
import { useEffect, useMemo, useState } from "react";
import initSqlJs, { Database } from "sql.js";
import { List } from "@raycast/api";
import { sql } from "./utils";
import fs from "node:fs";

type KanjiItem = {
  entry_id: number;
  data: JMdictWord;
};

type FormattedKanjiItem = {
  id: number;
  kanji?: string;
  kana: string;
  detail: string;
};

async function openDb() {
  const wasmBinary = fs.readFileSync(SQLITE_WASM_PATH);
  const SQL = await initSqlJs({ wasmBinary });
  return new SQL.Database(fs.readFileSync(DB_PATH));
}

function search(db: Database, query: string) {
  const stmt = db.prepare(
    sql`
      SELECT * FROM entries WHERE entry_id IN (
        SELECT entry_id FROM kana_index WHERE normalized_kana_text LIKE :query LIMIT 50
      )`,
    { ":query": `${query.trim()}%` },
  );

  const results: KanjiItem[] = [];
  while (stmt.step()) {
    const result = stmt.getAsObject();
    result.data = JSON.parse(result.data as string);
    results.push(result as unknown as KanjiItem);
  }
  stmt.free();

  return results;
}

function formatKanjiItem({ entry_id: id, data: item }: KanjiItem): FormattedKanjiItem {
  const kanji = item.kanji.at(0)?.text;
  const kana = item.kana.at(0)?.text || "No kana";
  const detail = `## ${kanji || kana} 

  ${item.sense.flatMap((sense) => sense.gloss.map((gloss) => `- ${gloss.text}`)).join("\n\n")}
  `;

  return {
    id,
    kanji,
    kana,
    detail,
  };
}

export default function Command() {
  const [db, setDb] = useState<Database>();
  const [query, setQuery] = useState<string>("りんご");

  useEffect(() => {
    openDb().then((db) => setDb(db));
    return () => db?.close();
  }, []);

  const results = useMemo(() => {
    if (!db || query.trim() === "") return [];
    return search(db, query);
  }, [db, query]);

  const formattedData = results.map(formatKanjiItem) || [];

  return (
    <List
      navigationTitle="Translate Japanese"
      searchBarPlaceholder="Search Yomicast..."
      searchText={query}
      onSearchTextChange={setQuery}
      isShowingDetail
    >
      {formattedData.map((item) => (
        <List.Item
          key={item.id}
          title={item.kanji ?? item.kana}
          subtitle={item.kanji ? item.kana : undefined}
          detail={<List.Item.Detail markdown={item.detail} />}
        />
      ))}
    </List>
  );
}
