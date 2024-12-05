import { generateUniqueRandomId } from "@/utils";
import { useRef } from "react";

const useUniqueRandomId = () => {
  const idRef = useRef<string>(generateUniqueRandomId());
  return idRef.current;
};

export default useUniqueRandomId;
