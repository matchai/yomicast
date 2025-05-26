import { List } from "@raycast/api";
import { DB_PATH } from "./lib";
import { useState } from "react";
import { useSQL } from "@raycast/utils";
import Turndown from "turndown";

const turndownService = new Turndown();

type KanjiItem = {
  id: string;
  entry: string;
  paraphrase: string;
};

export default function Command() {
  const [searchText, setSearchText] = useState<string>("");
  const { isLoading, data } = useSQL<KanjiItem>(DB_PATH, getKanjiQuery(searchText));

  return (
    <List
      navigationTitle="Translate Japanese"
      searchBarPlaceholder="Search Yomicast..."
      onSearchTextChange={setSearchText}
      isLoading={isLoading}
      isShowingDetail
    >
      {(data || []).map((item) => (
        <List.Item
          key={item.id}
          title={item.entry}
          detail={<List.Item.Detail markdown={turndownService.turndown(item.paraphrase)} />}
        />
      ))}
    </List>
  );
}

function getKanjiQuery(query: string) {
  return `
      SELECT 
        o.rowid AS id,
        o.entry AS entry,
        m.paraphrase AS paraphrase
      FROM mdx o
      JOIN mdx m
          ON m.entry = TRIM(REPLACE(o.paraphrase, '@@@LINK=', ''), CHAR(10))
      WHERE o.entry = '${query}'
      LIMIT 10; `;
}
