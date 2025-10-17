import { useThrottledFetch, SelectField, TextFieldProps } from "..";
import React from "react";

export interface ConceptUrlFieldProps extends TextFieldProps {
  conceptQueryEndpoint?: string;
  topLevelConcept?: string;
  fetchJson?: (url: string) => Promise<any>;
  initSearchValue?: string;
}

export async function conceptSPARQLQuery<T>({
  url,
  params,
  searchValue,
  topLevelConcept = "",
  fetchJson = (urlArg) => window.fetch(urlArg).then((res) => res.json())
}): Promise<T | null> {
  if (!searchValue?.trim()) {
    return null;
  }
  const topConceptQueryStr = topLevelConcept
    ? `?subject skos:broader+ <${topLevelConcept}> . `
    : " ";

  const query = `
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX agrovoc: <http://aims.fao.org/aos/agrovoc/>

  SELECT ?subject ?label
  WHERE {
    ${topConceptQueryStr}
    ?subject a skos:Concept .
    ?subject skos:prefLabel ?label .
      FILTER(
      LANG(?label) = "en" &&
      STRSTARTS(LCASE(STR(?label)), "${searchValue.toLowerCase()}")
    )
  }
 `;

  params.query = query;

  const urlObject = new URL(url);
  urlObject.search = new URLSearchParams(params).toString();

  try {
    const response = await fetchJson(urlObject.toString());

    if (response.error) {
      throw new Error(String(response.error));
    }

    // Search API returns an array ; Reverse API returns a single place:
    return response as T;
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** Input field for a number. */
export function ConceptUrlField(props: ConceptUrlFieldProps) {
  const {
    conceptQueryEndpoint,
    topLevelConcept,
    initSearchValue,
    name,
    label
  } = props;

  // const [options, setOptions] = useState([]);

  const { searchResult, doThrottledSearch } = useThrottledFetch({
    fetcher: (searchValue) => {
      searchValue = searchValue.replace(/\s+/g, " ").trim();
      return conceptSPARQLQuery({
        url: conceptQueryEndpoint,
        topLevelConcept: topLevelConcept,
        params: {},
        searchValue: searchValue
      });
    },
    timeoutMs: 1000,
    initSearchValue
  });

  return (
    <SelectField
      options={
        searchResult
          ? searchResult.results.bindings.map((b) => {
              return {
                label: b.label.value,
                value: JSON.stringify({
                  label: b.label.value,
                  uri: b.subject.value
                })
              };
            })
          : []
      }
      name={name}
      label={label}
      removeBottomMargin={true}
      disableTemplateCheckbox={true}
      onInputChange={(value, { action }) => {
        if (action === "input-change") {
          if (value.length > 2) {
            doThrottledSearch(value);
          }
        }
      }}
      placeholder="Type at least 3 characaters..."
    />
  );
}
