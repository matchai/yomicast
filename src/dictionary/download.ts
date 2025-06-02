import fs from "node:fs";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { environment, Toast } from "@raycast/api";
import { basename } from "node:path";
import AdmZip from "adm-zip";

export function getLatestDictionaryUrl() {
  // TODO: Get the latest dictionary URL
  return "https://github.com/scriptin/jmdict-simplified/releases/download/3.6.1%2B20250526122839/jmdict-examples-eng-3.6.1+20250526122839.json.zip";
}

export async function downloadFile(url: string, destination: string, toast: Toast) {
  try {
    const res = await fetch(url);
    if (!res.body) throw new Error("Failed to fetch dictionary: No response body");

    const contentLength = res.headers.get("content-length");
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    let downloadedBytes = 0;
    console.log("Downloading to", destination);
    const fileStream = fs.createWriteStream(destination, { flags: "w" });
    const readableStream = Readable.fromWeb(res.body);

    // Log the download progress
    readableStream.on("data", (chunk) => {
      downloadedBytes += chunk.length;

      const progress = Math.round((downloadedBytes / totalBytes) * 100);
      toast.message = `Progress: ${progress}%`;
    });

    await finished(readableStream.pipe(fileStream));
    return destination;
  } catch (error) {
    console.error("Error downloading dictionary:", error);
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to download dictionary";
    toast.message = "Please try again later.";
  }
}

export async function extractDictionary(zipPath: string, outputPath: string, toast: Toast) {
  toast.title = "Extracting dictionary...";
  toast.message = "";
  console.log("Extracting to", outputPath);

  // Extract the zip file in the archive
  try {
    const zip = new AdmZip(zipPath);
    for (const entry of zip.getEntries()) {
      if (!entry.name.endsWith(".json")) continue;
      zip.extractEntryTo(entry.entryName, environment.supportPath, false, true, false, basename(outputPath));

      toast.style = Toast.Style.Success;
      toast.title = "Dictionary updated successfully";
      toast.message = "";
      break;
    }
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to extract dictionary";
    toast.message = "Please try again later.";
    console.error("Error extracting dictionary:", error);
  }
}
