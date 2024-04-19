import { useFormikContext } from "formik";

export function useQueryBuilderEnterToSearch() {
  const { submitForm } = useFormikContext();

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      submitForm();
    }
  };

  return handleKeyDown;
}
