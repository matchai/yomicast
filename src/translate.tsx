import { List } from "@raycast/api";
import { getDictionary } from "./lib";
import { useState } from "react";
import { FuzzyWord } from "js-mdict";

export default function Command() {
  const [items, setItems] = useState<FuzzyWord[]>([]);
  getDictionary();

  function onSearchTextChange(searchText: string) {
    // const result = getDictionary().fuzzy_search(searchText, 5, 5);
    // console.log("Search results:", result);
    // setItems(result);
  }

  return (
    <List
      navigationTitle="Translate Japanese"
      searchBarPlaceholder="Search Yomicast..."
      onSearchTextChange={onSearchTextChange}
    ></List>
  );
}
