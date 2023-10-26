import { FieldSet, LoadingSpinner } from "packages/common-ui/lib";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { COLLECTING_EVENT_COMPONENT_NAME } from "packages/dina-ui/types/collection-api";
import { useState } from "react";
import useSWR from "swr";

async function fetchSoapValues(name: string): Promise<string | null> {
  if (!name?.trim()) {
    return null;
  }
  const url = `/tgn?name=${name}&placetypeid=ds&nationid=0`;
  return fetch(url).then((p) => p.text());
}

export function TgnIntegration() {
  const [nameValue, setNameValue] = useState<string>("");

  const [searchValue, setSearchValue] = useState<string>("");

  const search = () => {
    setSearchValue(nameValue);
  };

  const { isValidating: tgnSearchIsLoading, data: tgnSearchResults } = useSWR(
    searchValue,
    fetchSoapValues
  );

  return (
    <FieldSet
      legend={<DinaMessage id="tgnLegend" />}
      className="non-strip"
      componentName={COLLECTING_EVENT_COMPONENT_NAME}
    >
      <div
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          maxHeight: 520
        }}
      />
      <div className="flex-grow-1">
        <input
          aria-label="tgn-label1"
          className="form-control"
          onChange={(e) => setNameValue(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.keyCode === 13) {
              e.preventDefault();
              search();
            }
          }}
          value={nameValue}
        />
      </div>
      <div className="flex-grow-1">
        <input
          aria-label="tgn-label2"
          className="form-control"
          // onChange={(e) => console.log(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.keyCode === 13) {
              e.preventDefault();
              search();
            }
          }}
          value="volume"
        />
      </div>
      <div className="flex-grow-1">
        <input
          aria-label="tgn-label3"
          className="form-control"
          // onChange={(e) => console.log(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.keyCode === 13) {
              e.preventDefault();
              search();
            }
          }}
          value="volume"
        />
      </div>
      <div className="mb-3 d-flex">
        <button
          style={{ width: "10rem" }}
          onClick={search}
          className="btn btn-primary ms-auto geo-search-button"
          type="button"
        >
          <DinaMessage id="searchButton" />
        </button>
      </div>
      <div className="flex-grow-1">
        {tgnSearchIsLoading ? (
          <LoadingSpinner loading={true} />
        ) : tgnSearchResults?.length === 0 ? (
          <DinaMessage id="noResultsFound" />
        ) : (
          <>{tgnSearchResults} </>
        )}
      </div>
    </FieldSet>
  );
}
