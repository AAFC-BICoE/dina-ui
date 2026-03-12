import { useQueryBuilderContext } from "../QueryBuilder";

export function useQueryBuilderEnterToSearch(disabled = false) {
  const { performSubmit } = useQueryBuilderContext() || {};
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && performSubmit) {
      performSubmit?.();
    }
  };
  if (disabled) {
    return undefined;
  }
  return handleKeyDown;
}
