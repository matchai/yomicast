import fs from "node:fs/promises";
import fsSync from "node:fs";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { environment, Toast } from "@raycast/api";
import path from "node:path";
import { exec } from "node:child_process";

export async function extractDictionary(filePath: string, toast: Toast) {
  toast.title = "Extracting dictionary...";
  toast.message = "";

  const parsedGz = path.parse(filePath);
  const extractedPath = path.join(environment.supportPath, parsedGz.name);
  if (fsSync.existsSync(extractedPath)) {
    await fs.rm(extractedPath, { recursive: true });
  }

  try {
    // Unzip the file
    await new Promise((resolve) => {
      exec(`gunzip --stdout "${filePath}" > "${extractedPath}"`, (err) => {
        if (err) console.error(err);
      }).on("exit", async () => {
        resolve(true);
      });
    });
    console.log("Dictionary extracted to", extractedPath);

    toast.style = Toast.Style.Success;
    toast.title = "Dictionary updated successfully";
    toast.message = "";
    return extractedPath;
  } catch (error) {
    console.error("Error extracting dictionary:", error);
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to extract dictionary";
    toast.message = "Please try again later.";
    return null;
  }
}

export async function downloadFile(url: string, destination: string, toast: Toast) {
  try {
    const res = await fetch(url);
    if (!res.body) throw new Error("Failed to fetch dictionary: No response body");

    const contentLength = res.headers.get("content-length");
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    let downloadedBytes = 0;
    const filename = path.basename(url);
    const destinationPath = path.join(destination, filename);
    console.log("Downloading to", destinationPath);
    const fileStream = fsSync.createWriteStream(destinationPath, { flags: "w" });
    const readableStream = Readable.fromWeb(res.body);

    // Log the download progress
    readableStream.on("data", (chunk) => {
      downloadedBytes += chunk.length;

      const progress = Math.round((downloadedBytes / totalBytes) * 100);
      toast.message = `Progress: ${progress}%`;
    });

    await finished(readableStream.pipe(fileStream));
    return destinationPath;
  } catch (error) {
    console.error("Error downloading dictionary:", error);
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to download dictionary";
    toast.message = "Please try again later.";
  }
}
