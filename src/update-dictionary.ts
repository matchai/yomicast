import fs from "node:fs/promises";
import fsSync from "node:fs";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { environment, showToast, Toast } from "@raycast/api";
import yauzl from "yauzl";
import { DICTIONARY_PATH, DICTIONARY_URL, DOWNLOAD_PATH } from "./lib";

export default async function Command() {
  await updateDictionary();
}

async function updateDictionary() {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Downloading latest dictionary...",
    message: `Progress: 0%`,
  });

  await downloadDictionary(toast);
  await extractDictionary(toast);
  console.log(environment.supportPath);
  // await importDictionary(toast);
}

async function downloadDictionary(toast: Toast) {
  try {
    const res = await fetch(DICTIONARY_URL);
    if (!res.body) throw new Error("Failed to fetch dictionary: No response body");

    const contentLength = res.headers.get("content-length");
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    let downloadedBytes = 0;
    console.log("Downloading to", DOWNLOAD_PATH);
    const fileStream = fsSync.createWriteStream(DOWNLOAD_PATH, { flags: "w" });
    const readableStream = Readable.fromWeb(res.body);

    // Log the download progress
    readableStream.on("data", (chunk) => {
      downloadedBytes += chunk.length;

      const progress = Math.round((downloadedBytes / totalBytes) * 100);
      toast.message = `Progress: ${progress}%`;
    });

    await finished(readableStream.pipe(fileStream));
  } catch (error) {
    console.error("Error downloading dictionary:", error);
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to download dictionary";
    toast.message = "Please try again later.";
  }
}

// Extract the .mdx file from the downloaded zip file
export async function extractDictionary(toast: Toast) {
  try {
    if (!fsSync.existsSync(DOWNLOAD_PATH)) {
      toast.style = Toast.Style.Failure;
      toast.title = "Dictionary download failed";
      toast.message = "Downloaded file not found. Please try again.";
      return;
    }

    if (!fsSync.existsSync(DICTIONARY_PATH)) {
      await fs.unlink(DICTIONARY_PATH);
    }

    await new Promise<void>((resolve, reject) => {
      yauzl.open(DOWNLOAD_PATH, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err);

        zipfile.readEntry();
        zipfile.on("entry", (entry) => {
          if (/\.mdx$/.test(entry.fileName)) {
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) return reject(err);

              const writeStream = fsSync.createWriteStream(DICTIONARY_PATH, { flags: "w" });
              readStream.pipe(writeStream);
              writeStream.on("finish", () => {
                zipfile.close();
                toast.style = Toast.Style.Success;
                toast.title = "Dictionary updated successfully";
                toast.message = "";
                resolve();
              });
            });
          } else {
            zipfile.readEntry();
          }
        });

        zipfile.on("error", reject);
      });
    });
  } catch (error: unknown) {
    console.error("Error extracting dictionary:", error);
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to extract dictionary";
    toast.message = "Please try again later.";
  }
}
