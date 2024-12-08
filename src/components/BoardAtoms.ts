import { atom } from "recoil";

export const boardDragHandlesAtom = atom<{
  [id: string]: HTMLDivElement | null;
}>({
  key: "boardDragHandlesAtom",
  default: {},
});
