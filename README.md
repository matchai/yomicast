# Yomicast

Offline Japanese-English dictionary lookup. Yomitan's instant search within Raycast.

Search kaji, kana, and English terms without an internet connection.

### Getting Started

Since Yomicast is still very much a work-in-progress, I don't have dictionary importing done yet. For the time being, what I've done is:

1. Download the latest Jitendex MDict dictionary from here: https://jitendex.org/pages/downloads.html
2. Use [`mdict-utils`](https://github.com/liuyug/mdict-utils) to convert it to a sqlite table:

   ```sh
     mdict -x jitendex-mdict.mdx --exdb
   ```

3. Drop the generated `jitendex.db` file into your plugin's environment support path: `~/Library/Application Support/com.raycast.macos/extensions/yomicast`
