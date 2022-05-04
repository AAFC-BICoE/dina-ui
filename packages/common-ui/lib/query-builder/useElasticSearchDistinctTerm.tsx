interface QuerySuggestionFieldProps {
  /** What the user has entered so far into the text field. */
  textEntered: string;

  /** Turn off the search, mainly used to determine if the user has focused on the text field. */
  disabled: boolean;
}

export function useElasticSearchDistinctTerm({
  textEntered,
  disabled
}: QuerySuggestionFieldProps) {
  // Do not perform any searching if disabled. Return an empty result.
  if (disabled) return { loading: false, response: { data: [] } };

  return {
    loading: true,
    response: undefined
  };
}
