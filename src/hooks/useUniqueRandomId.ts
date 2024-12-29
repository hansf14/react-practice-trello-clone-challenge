import { useRef } from "react";
import { generateUniqueRandomId } from "@/utils";

const useUniqueRandomId = () => {
  const idRef = useRef<string>(generateUniqueRandomId());
  return idRef.current;
};

export default useUniqueRandomId;
