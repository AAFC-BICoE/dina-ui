interface QueryRowGlobalSearchProps {
  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;
}

// In progress...
// export default function QueryRowManagedAttributeSearch({
//   value,
//   setValue
// }: QueryRowGlobalSearchProps) {
//   return (

//   );
// };