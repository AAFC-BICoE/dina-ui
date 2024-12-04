import { useContext } from "react";
import { InstanceContext } from "./InstanceContextProvider";

export function useInstanceContext() {
  const instanceContext = useContext(InstanceContext);
  return instanceContext;
}
