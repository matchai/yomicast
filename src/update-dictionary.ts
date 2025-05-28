import { showToast, Toast } from "@raycast/api";
import { downloadFile, extractDictionary } from "./dictionary/download";
import { loadDictionary } from "@scriptin/jmdict-simplified-loader";
import { TEMP_DIR } from "./constants";

const downloadUrl =
  "https://github.com/scriptin/jmdict-simplified/releases/download/3.6.1%2B20250526122839/jmdict-eng-3.6.1+20250526122839.json.zip";

export default async function Command() {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Downloading latest dictionary...",
    message: `Progress: 0%`,
  });

  const gzPath = await downloadFile(downloadUrl, TEMP_DIR, toast);
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

  await new Promise((resolve, reject) => {
    const loader = loadDictionary("jmdict", dictPath)
      .onMetadata((metadata) => console.log("Metadata:", JSON.stringify(metadata, null, 2)))
      .onEntry((entry, metadata) => {})
      .onEnd(() => {
        toast.style = Toast.Style.Success;
        toast.title = "Dictionary updated successfully";
        toast.message = "You can now use the latest dictionary.";
        resolve(null);
      });

    loader.parser.on("error", (error: unknown) => {
      toast.style = Toast.Style.Failure;
      toast.title = "Error loading dictionary";
      console.log("Failed to parse dictionary:", error);
      reject(error);
    });
  });
}
