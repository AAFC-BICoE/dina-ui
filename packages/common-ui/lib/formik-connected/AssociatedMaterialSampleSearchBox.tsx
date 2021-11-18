import classNames from "classnames";
import { PersistedResource } from "kitsu";
import React, { useRef, useState } from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import { FieldWrapper, FieldWrapperProps } from "..";
import { MaterialSampleLink } from "../../../dina-ui/components/collection/MaterialSampleAssociationsField";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { SampleListLayout } from "../../../dina-ui/pages/collection/material-sample/list";
import { MaterialSample } from "../../../dina-ui/types/collection-api/resources/MaterialSample";

export function AssociatedMaterialSampleSearchBox(props: FieldWrapperProps) {
  const [showSearchAssociatedSample, setShowSearchAssociatedSample] =
    useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const { formatMessage } = useDinaIntl();

  function onSearchClicked() {
    setShowSearchAssociatedSample(true);
  }

  function onCloseClicked() {
    if (listRef.current) {
      listRef.current.className = listRef.current.className + " d-none";
    }
    setShowSearchAssociatedSample(false);
  }

  return (
    <div>
      <label className="w-100">
        <strong>{formatMessage("associatedMaterialSample")}</strong>{" "}
      </label>
      {!showSearchAssociatedSample ? (
        <button
          type="button"
          className="btn btn-secondary mb-2 col-md-4 searchSample"
          onClick={() => onSearchClicked()}
        >
          {formatMessage("search") + "..."}
        </button>
      ) : (
        <div>
          <FieldWrapper {...props} hideLabel={true} disableLabelClick={true}>
            {({ setValue, value }) => {
              function onAssociatedSampleSelected(
                sample: PersistedResource<MaterialSample>
              ) {
                // Close the search result list box when a selection is made
                // so that it is easier for user to see the Add button
                if (listRef.current) {
                  listRef.current.className =
                    listRef.current.className + " d-none";
                }
                setValue(sample.id);
              }

              /** Clear the input value */
              function removeEntry() {
                setValue(null);
                setShowSearchAssociatedSample(false);
              }

              return (
                <div className="d-flex flex-column">
                  <div className={"d-flex flex-row"}>
                    <div
                      className="flex-md-grow-1 form-control associatedSampleInput"
                      style={{ backgroundColor: "#e9ecef" }}
                    >
                      {value && <MaterialSampleLink id={value} />}
                    </div>
                    <button
                      className="btn mb-2"
                      onClick={removeEntry}
                      type="button"
                      style={{
                        cursor: "pointer"
                      }}
                    >
                      <RiDeleteBinLine size="1.8em" className="ms-auto" />
                    </button>
                  </div>
                  <div
                    ref={listRef}
                    className={classNames(
                      "p-2 mt-2",
                      !showSearchAssociatedSample && "d-none"
                    )}
                    style={{ borderStyle: "dashed" }}
                  >
                    <div className="mb-4">
                      <span
                        className="me-2 fw-bold"
                        style={{ fontSize: "1.2em" }}
                      >
                        {formatMessage("search")}
                      </span>
                      <button className="btn btn-dark" onClick={onCloseClicked}>
                        {formatMessage("closeButtonText")}
                      </button>
                    </div>
                    <SampleListLayout
                      onSelect={onAssociatedSampleSelected}
                      classNames="btn btn-primary selectMaterialSample"
                      btnMsg={formatMessage("select")}
                      hideTopPagination={true}
                      hideGroupFilter={true}
                    />
                  </div>
                </div>
              );
            }}
          </FieldWrapper>
        </div>
      )}
    </div>
  );
}
