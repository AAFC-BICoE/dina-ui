import { useQueryPageContext } from "../../QueryPage";

export function useQueryBuilderEnterToSearch() {
  const { performSubmit } = useQueryPageContext();
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      performSubmit();
    }
  };

  return handleKeyDown;
}
