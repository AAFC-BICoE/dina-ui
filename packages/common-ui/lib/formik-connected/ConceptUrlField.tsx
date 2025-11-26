import { useThrottledFetch, SelectField, TextFieldProps } from "..";
import { useIntl } from "react-intl";
import { ReadOnlyValue } from "./FieldView";
import { components } from "react-select";

import { useField } from "formik";

export interface ConceptUrlFieldProps extends TextFieldProps {
  conceptQueryEndpoint?: string;
  topLevelConcept?: string;
  fetchJson?: (url: string) => Promise<any>;
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

export function ConceptUrlField(props: ConceptUrlFieldProps) {
  const { conceptQueryEndpoint, topLevelConcept, name, label } = props;
  const { formatMessage } = useIntl();

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
    timeoutMs: 1000
  });

  const customReadOnlyRender = (value: string) => {
    const value_object = JSON.parse(value);
    return (
      <div className="read-only-view">
        <ReadOnlyValue
          link={value_object.uri}
          value={value_object.label}
          isExternalLink={true}
        />
      </div>
    );
  };

  const CustomOption = (props) => {
    const value_object = JSON.parse(props.data.value);

    return (
      <components.Option {...props}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "bold" }}>{props.data.label}</span>
          <span style={{ fontSize: "11px", opacity: 0.7 }}>
            {value_object.uri}
          </span>
          <a
            href={value_object.uri}
            className="btn btn-info btn-sm"
            style={{
              padding: "0"
            }}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              window.open(value_object.uri, "_blank", "noopener,noreferrer");
            }}
          >
            {formatMessage({ id: "viewDetailButtonLabel" })}
          </a>
        </div>
      </components.Option>
    );
  };

  // in order to prepare the Select options accordingly we need to access
  // the actual formik value when editing an existing data entry
  const [thisField] = useField(name);
  const initialFormikValue = thisField.value;
  const initialOption = initialFormikValue
    ? [
        {
          label: JSON.parse(initialFormikValue).label,
          value: initialFormikValue
        }
      ]
    : [];

  return (
    <SelectField
      selectProps={{
        placeholder: formatMessage({ id: "typeAtLeast2Characters" }),
        components: { Option: CustomOption },
        isClearable: true
      }}
      options={[
        ...(searchResult
          ? searchResult.results.bindings.map((b) => ({
              label: b.label.value,
              value: JSON.stringify({
                label: b.label.value,
                uri: b.subject.value
              })
            }))
          : []),
        ...(initialOption || []) // add initial value if present
      ]}
      name={name}
      label={label}
      removeBottomMargin={true}
      disableTemplateCheckbox={true}
      onInputChange={(value, { action }) => {
        if (action === "input-change") {
          if (value.length >= 2) {
            doThrottledSearch(value);
          }
        }
      }}
      readOnlyRender={customReadOnlyRender}
    />
  );
}
