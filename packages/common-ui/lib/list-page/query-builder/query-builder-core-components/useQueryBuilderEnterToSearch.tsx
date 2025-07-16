import { useQueryBuilderContext } from "../QueryBuilder";

export function useQueryBuilderEnterToSearch() {
  const { performSubmit } = useQueryBuilderContext() || {};
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && performSubmit) {
      performSubmit?.();
    }
  };

  return handleKeyDown;
}
