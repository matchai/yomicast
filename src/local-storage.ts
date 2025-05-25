import { LocalStorage as RaycastLocalStorage } from "@raycast/api";

type LocalStorageCatalog = {
  isDictionaryReady: boolean;
  isDictionaryDownloading: boolean;
  dictionaryVersion: string;
};

export type LocalStorageKey = keyof LocalStorageCatalog;

export class LocalStorage {
  static async getItem<T extends LocalStorageKey>(key: T): Promise<LocalStorageCatalog[T] | undefined> {
    return RaycastLocalStorage.getItem(key);
  }

  static async setItem<T extends LocalStorageKey>(key: T, value: LocalStorageCatalog[T]): Promise<void> {
    return RaycastLocalStorage.setItem(key, value);
  }
}
