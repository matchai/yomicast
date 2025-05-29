import { JMdictWord } from "@scriptin/jmdict-simplified-types";
import { DB_PATH, SQLITE_WASM_PATH } from "./constants";
import { useEffect, useMemo, useState } from "react";
import initSqlJs, { Database } from "sql.js";
import { Action, ActionPanel, List } from "@raycast/api";
import { normalizeKana, sql } from "./utils";
import fs from "node:fs";

type KanjiItem = {
  entry_id: number;
  data: JMdictWord;
};

type FormattedKanjiItem = {
  id: number;
  kana: string;
  kanji?: string;
  definition?: string;
  detail: string;
};

async function openDb() {
  const wasmBinary = fs.readFileSync(SQLITE_WASM_PATH);
  const SQL = await initSqlJs({ wasmBinary });
  return new SQL.Database(fs.readFileSync(DB_PATH));
}

function search(db: Database, query: string) {
  const normalizedQuery = normalizeKana(query.trim().toLowerCase());
  const stmt = db.prepare(
    sql`
      SELECT * FROM entries WHERE entry_id IN (
        SELECT entry_id FROM kana_index WHERE normalized_kana_text LIKE :query LIMIT 50
      )`,
    { ":query": `${normalizedQuery}%` },
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
  const definition = item.sense.at(0)?.gloss.at(0)?.text;
  const detail = `## ${kanji || kana}

  ${item.sense.flatMap((sense) => sense.gloss.map((gloss) => `- ${gloss.text}`)).join("\n\n")}`;

  return {
    id,
    kanji,
    kana,
    definition,
    detail,
  };
}

export default function Command() {
  const [db, setDb] = useState<Database>();
  const [query, setQuery] = useState("りんご");
  const [showingDetail, setShowingDetail] = useState(false);

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
