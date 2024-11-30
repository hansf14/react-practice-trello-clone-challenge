import { Indexer } from "@/utils";
import { RecoilState, useRecoilState, useSetRecoilState } from "recoil";

export const useRecoilManager = <
  T extends Record<Index, string>,
  Index extends keyof T,
>({
  recoilList,
  recoilIndexer,
  indexName,
}: {
  recoilList: RecoilState<T[]>;
  recoilIndexer: RecoilState<Indexer<T, Index>>;
  indexName: Index;
}) => {
  const [list, setList] = useRecoilState(recoilList);
  const setIndexer = useSetRecoilState(recoilIndexer);

  const addEntry = ({ newEntry }: { newEntry: T }) => {
    // Add the new entry to the list
    const updatedList = [...list, newEntry];
    setList(updatedList);

    // Update the indexer incrementally
    setIndexer((prev) => ({
      ...prev,
      [newEntry[indexName]]: newEntry,
    }));
  };

  const removeEntry = ({ index }: { index: T[Index] }) => {
    // Remove the entry from the list
    const updatedList = list.filter((entry) => entry[indexName] !== index);
    setList(updatedList);

    // Update the indexer incrementally
    setIndexer((prev) => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateEntry = ({ updatedEntry }: { updatedEntry: T }) => {
    // Update the entry in the list
    const updatedList = list.map((entry) =>
      entry[indexName] === updatedEntry[indexName] ? updatedEntry : entry,
    );
    setList(updatedList);

    // Update the indexer incrementally
    setIndexer((prev) => ({
      ...prev,
      [updatedEntry[indexName]]: updatedEntry,
    }));
  };

  return { addEntry, removeEntry, updateEntry };
};
