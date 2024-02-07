import { useContext } from "react";
import { InstanceContext } from "./InstanceProvider";

export function useInstance() {
  const instanceContext = useContext(InstanceContext);
  return instanceContext
}