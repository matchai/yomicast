import { updateDictionary } from "./dictionary";

export default async function Command() {
  await updateDictionary();
}
