import {
  FormikButton,
  LoadingSpinner,
  Tooltip,
  useInstanceContext
} from "common-ui";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { useState } from "react";
import useSWR from "swr";
import { XMLParser } from "fast-xml-parser";
import { FormikContextType, FormikProps } from "formik";

/**
 * TGN TermMatch API, just for parsing the TGN response.
 */
export interface TgnApiEntry {
  Preferred_Term: string;
  Preferred_Parent: string;
  Subject_ID: string;
}

/**
 * TGN Parent, just for parsing the TGN response.
 */
export interface TGNParent {
  Parent_Subject_ID: string;
  Parent_String: string;
}

/**
 * TGN Parents API, just for parsing the TGN response.
 */
export interface TGNParentRelationships {
  Preferred_Parent: TGNParent;
  NonPreferred_Parent?: TGNParent[];
}

export interface TgnSelectSearchResultDetail {
  tgn: TgnApiEntry;
  formik: FormikContextType<any>;
}

interface TgnSearchBoxProps {
  onInputChange: (value: string) => void;
  inputValue: string;
  onSelectSearchResult: (detail: TgnSelectSearchResultDetail) => void;
}

export async function fetchTgnParents({
  tgn,
  formik
}: TgnSelectSearchResultDetail) {
  const url = `/tgn/TGNGetParents?subjectID=${tgn.Subject_ID}`;

  const parser = new XMLParser({
    isArray: (name) => name === "Non-Preferred_Parent",
    transformTagName: (tag) => tag.replaceAll("-", "")
  });

  return window
    .fetch(url)
    .then((p) => p.text())
    .then((p) => {
      return parser.parse(p)?.Vocabulary?.Subject
        ?.Parent_Relationships as TGNParentRelationships;
    })
    .then((f) => {
      formik.setFieldValue("geographicThesaurus.source", "TGN");
      formik.setFieldValue("geographicThesaurus.subjectId", tgn.Subject_ID);
      formik.setFieldValue(
        "geographicThesaurus.preferredTerm",
        tgn.Preferred_Term
      );
      formik.setFieldValue(
        "geographicThesaurus.preferredParent",
        f.Preferred_Parent.Parent_String
      );

      formik.setFieldValue(
        "geographicThesaurus.additionalParents",
        f.NonPreferred_Parent?.map((p) => p.Parent_String)
      );
    });
}

async function fetchSoapValues(
  name: string,
  tgnUrl: string
): Promise<TgnApiEntry[] | null> {
  if (!name?.trim()) {
    return null;
  }

  // Ignore the nation and place filter
  const url = `${tgnUrl}/TGNService.asmx/TGNGetTermMatch?name=${name}&placetypeid=&nationid=`;

  const parser = new XMLParser({
    isArray: (n) => n === "Subject" // for one element lists
  });

  return await window
    .fetch(url)
    .then((p) => p.text())
    .then((p) => {
      const response = parser.parse(p);
      if (response?.Vocabulary?.Count === 0) {
        return [];
      }

      return response?.Vocabulary?.Subject as TgnApiEntry[];
    });
}

export function TgnViewDetailButton({ subjectId }: { subjectId: string }) {
  return (
    <a
      title="tgn-detail"
      target="_blank"
      rel="noopener noreferrer"
      href={`https://vocab.getty.edu/page/tgn/${subjectId}`}
      className="btn btn-info"
    >
      <DinaMessage id="viewDetailButtonLabel" />
    </a>
  );
}

export interface TgnDetailsProps {
  formik: FormikProps<any>;
}

/**
 * Render text fields with details
 */
export function TgnDetails(props: TgnDetailsProps) {
  const { formatMessage } = useDinaIntl();

  const subjectId = props.formik.getFieldMeta(
    "geographicThesaurus.subjectId"
  ).value;
  const preferredTerm = props.formik.getFieldMeta(
    "geographicThesaurus.preferredTerm"
  ).value;
  const preferredParent = props.formik.getFieldMeta(
    "geographicThesaurus.preferredParent"
  ).value as string;
  const additionalParents = props.formik.getFieldMeta(
    "geographicThesaurus.additionalParents"
  ).value as string[];

  return (
    <div>
      <div className="row mb-2">
        <div className="col-sm">
          <strong>{formatMessage("tgnPreferredTerm")}</strong> {preferredTerm}
        </div>
        <div className="col-sm">
          <strong>{formatMessage("tgnId")}</strong> {subjectId}
        </div>
      </div>
      <div className="mb-2">
        <strong>{formatMessage("tgnPreferredParent")}</strong>:{" "}
        {preferredParent}
      </div>
      {additionalParents
        ? additionalParents.map((value, index) => (
            <div key={index}>
              <strong>Additional Parent {index + 1}</strong>: {value}
            </div>
          ))
        : null}
    </div>
  );
}

export function TgnSearchBox({
  onInputChange,
  inputValue,
  onSelectSearchResult
}: TgnSearchBoxProps) {
  const [searchValue, setSearchValue] = useState<string>("");
  const instanceContext = useInstanceContext();

  const search = () => {
    setSearchValue(inputValue);
  };

  const { formatMessage } = useDinaIntl();

  const { isValidating: tgnSearchIsLoading, data: tgnSearchResults } = useSWR(
    [searchValue, instanceContext?.tgnSearchBaseUrl],
    fetchSoapValues,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  return (
    <div className="m-2">
      <div className="d-flex mb-3">
        <div className="pt-2">
          <strong>
            <DinaMessage id="tgnSearchLabel" />
          </strong>
          <Tooltip id="tgnSearchTooltip" />
        </div>
        <div className="flex-grow-1">
          <input
            aria-label="tgn-label1"
            className="form-control"
            onChange={(e) => onInputChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.keyCode === 13) {
                e.preventDefault();
                search();
              }
            }}
            value={inputValue}
          />
        </div>
      </div>
      <div className="mb-3 d-flex">
        <button
          style={{ width: "10rem" }}
          onClick={search}
          className="btn btn-primary ms-auto tgn-search-button"
          type="button"
          disabled={tgnSearchIsLoading || !inputValue}
        >
          <DinaMessage id="searchButton" />
        </button>
      </div>
      <div className="list-group mb-3">
        {tgnSearchIsLoading ? (
          <LoadingSpinner loading={true} />
        ) : tgnSearchResults?.length === 0 ? (
          <DinaMessage id="noResultsFound" />
        ) : (
          tgnSearchResults?.map((p) => (
            <div className="list-group-item" key={p.Subject_ID}>
              <div className="row">
                <div className="col-md-8">
                  <strong>{formatMessage("tgnPreferredTerm")}:</strong>{" "}
                  {p.Preferred_Term}
                </div>
                <div className="col-md-4">
                  <strong>{formatMessage("tgnId")}:</strong> {p.Subject_ID}
                </div>
              </div>
              <div className="row">
                <strong>{formatMessage("tgnPreferredParent")}:</strong>{" "}
                {p.Preferred_Parent}
              </div>
              <div className="row">
                <div className="col-md-4">
                  <FormikButton
                    className="btn btn-primary"
                    onClick={(_, formik) =>
                      onSelectSearchResult({ tgn: p, formik })
                    }
                  >
                    <DinaMessage id="select" />
                  </FormikButton>
                </div>
                <div className="col-md-4">
                  <TgnViewDetailButton subjectId={p.Subject_ID} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
