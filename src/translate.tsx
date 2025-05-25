import { List } from "@raycast/api";
import { LocalStorage } from "./local-storage";
import { useCachedState } from "@raycast/utils";

export default function Command() {
  const [dictionaryReady, setDictionaryReady] = useCachedState(
    "dictionary-ready",
    LocalStorage.getItem("isDictionaryReady"),
  );

  return <List navigationTitle="Translate Japanese" searchBarPlaceholder="Search Yomicast..."></List>;
}
