import { List } from "@raycast/api";
import { DB_PATH } from "./lib";
import { useState } from "react";
import { useSQL } from "@raycast/utils";
// import Turndown from "turndown";
import { HTMLElement, Node, NodeType, parse } from "node-html-parser";

// const turndownService = new Turndown();

type KanjiItem = {
  id: string;
  entry: string;
  paraphrase: string;
};

export default function Command() {
  const [searchText, setSearchText] = useState<string>("うち");
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
                  <List.Item.Detail.Metadata.Separator />
                  <List.Item.Detail.Metadata.Label
                    title="Definitions"
                    text={
                      item.definitions?.map((definition) => definition.trim()).join(" | ") || "No definitions found"
                    }
                  />
                  {/* {item.definitions?.map((definition, index) => (
                    <List.Item.Detail.Metadata.Label key={index} title={`${index + 1}.`} text={definition} />
                  ))} */}
                  {item.footnoteLinks.length > 0 && <List.Item.Detail.Metadata.Separator />}
                  {item.footnoteLinks.map((link) => (
                    <List.Item.Detail.Metadata.Link
                      key={link.title}
                      title={link.title}
                      text={link.text}
                      target={link.url}
                    />
                  ))}
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

  const definitions = html.querySelector(".glossary")?.childNodes.map((node) => node.text);

  const footnoteLinks = html
    .querySelectorAll(".entry-footnotes a")
    .filter(isValidLink)
    .map((link) => ({
      title: link.text,
      text: kanji || kana,
      url: link.getAttribute("href")!,
    }));

  return {
    ...item,
    kana,
    kanji,
    definitions,
    footnoteLinks,
  };
}

function isValidLink(link: HTMLElement) {
  if (!link.getAttribute("href")) return false;

  const validSites = ["edrdg.org"];
  const href = link.getAttribute("href")!;
  return validSites.some((site) => href.includes(site));
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
