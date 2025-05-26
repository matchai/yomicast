import { List } from "@raycast/api";
import { DB_PATH } from "./lib";
import { useState } from "react";
import { useSQL } from "@raycast/utils";
import Turndown from "turndown";
import { Node, NodeType, parse } from "node-html-parser";

const turndownService = new Turndown();

type KanjiItem = {
  id: string;
  entry: string;
  paraphrase: string;
};

export default function Command() {
  const [searchText, setSearchText] = useState<string>("林檎");
  const { isLoading, data } = useSQL<KanjiItem>(DB_PATH, getKanjiQuery(searchText));

  const formattedData = data?.map(formatKanjiItem) || [];

  return (
    <List
      navigationTitle="Translate Japanese"
      searchBarPlaceholder="Search Yomicast..."
      searchText={searchText}
      onSearchTextChange={setSearchText}
      isLoading={isLoading}
      isShowingDetail
    >
      {formattedData.map((item) => (
        <List.Item
          key={item.id}
          title={item.kanji || item.kana}
          subtitle={item.kanji ? item.kana : undefined}
          detail={
            <List.Item.Detail
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label title="Kanji" text={item.kanji} />
                  <List.Item.Detail.Metadata.Label title="Kana" text={item.kana} />
                </List.Item.Detail.Metadata>
              }
            />
          }
        />
      ))}
    </List>
  );
}

function formatKanjiItem(item: KanjiItem) {
  const html = parse(item.paraphrase);

  // Extract kana from ruby elements (furigana)
  const kana =
    html
      .querySelectorAll(".headword rt")
      ?.map((part) => part.text)
      .join("") || item.entry;

  // Extract kanji by filtering furigana
  const kanji = html
    .querySelectorAll(".headword ruby")
    .flatMap((char) => char.childNodes.filter((node) => node.nodeType === NodeType.TEXT_NODE))
    .map((node: Node) => node.text)
    .join("");

  return {
    ...item,
    kana,
    kanji,
    detail: turndownService.turndown(item.paraphrase),
  };
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
