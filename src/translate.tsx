import { List } from "@raycast/api";
import { DB_PATH } from "./lib";
import { useState } from "react";
import { useSQL } from "@raycast/utils";
import { HTMLElement, Node, NodeType, parse } from "node-html-parser";

type KanjiItem = {
  id: string;
  entry: string;
  paraphrase: string;
};

export default function Command() {
  const [searchText, setSearchText] = useState<string>("発条");
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
          detail={<List.Item.Detail markdown={KanjiItemToMarkdown(item)} />}
        />
      ))}
    </List>
  );
}

function formatKanjiItem(item: KanjiItem) {
  const html = parse(item.paraphrase);
  const headword = html.querySelector(".headword")!;

  const kana = extractKana(headword) ?? item.entry;
  const kanji = extractKanji(headword);

  console.log({ kana, kanji });

  const definitionGroups = html.querySelectorAll(".sense-group");

  const definitions = definitionGroups.map((group) => {
    const groupTitle = group.querySelector(".part-of-speech-info")?.text;
    const groupDefinitions = group.querySelectorAll(".gloss").map((def) => {
      return def.text;
    });

    return {
      title: groupTitle,
      definitions: groupDefinitions,
    };
  });

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

function KanjiItemToMarkdown(item: ReturnType<typeof formatKanjiItem>) {
  return `
  ## ${item.kanji ? `${item.kanji} ⋅ ${item.kana}` : item.kana}

  ${item.definitions?.map((def) => `### ${def.title || "Definition"}\n${def.definitions.map((def) => `1. ${def}`).join("\n")}`).join("\n")}`;
}

/** Extract kana from provided html's furigana */
function extractKana(html: HTMLElement) {
  const hasRuby = html.querySelector("ruby");
  if (!hasRuby) return html.text;

  return html
    .querySelectorAll("rt")
    ?.map((part) => part.text)
    .join("");
}

/** Extract kanji by removing provided html's furigana */
function extractKanji(html: HTMLElement) {
  return html
    .querySelectorAll("ruby")
    .flatMap((char) => char.childNodes.filter((node) => node.nodeType === NodeType.TEXT_NODE))
    .map((node: Node) => node.text)
    .join("");
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
