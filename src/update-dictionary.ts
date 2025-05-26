import { environment, showToast, Toast } from "@raycast/api";
import { downloadFile, extractDictionary } from "./dictionary/download";
import { loadDictionary } from "@scriptin/jmdict-simplified-loader";
import { TEMP_DIR } from "./constants";
import path from "node:path";

export default async function Command() {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Downloading latest dictionary...",
    message: `Progress: 0%`,
  });

  const gzPath = await downloadFile("http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz", TEMP_DIR, toast);
  if (!gzPath) {
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to download dictionary";
    toast.message = "Please try again later.";
    return;
  }

  const dictPath = await extractDictionary(gzPath, toast);
  if (!dictPath) {
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to extract dictionary";
    toast.message = "Please try again later.";
    return;
  }

  // const dictPath = path.join("~/Download", "jmdict-eng-3.6.1.json");
  console.log("Loading dictionary from", dictPath);
  const loader = loadDictionary("jmdict", dictPath).onEntry((entry) => {
    console.log(entry.id, entry.kanji[0], entry.kana[0], entry.sense);
  });
  console.log(loader);
  loader.onMetadata((metadata) => {
    console.log("Metadata:", metadata);
  });
  loader.parser.on("error", (error: unknown) => {
    console.error(error);
  });
}
