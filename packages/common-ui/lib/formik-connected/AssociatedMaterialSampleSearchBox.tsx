import React, { useState } from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import { FieldWrapper, FieldWrapperProps, FieldWrapperRenderProps } from "..";
import { MaterialSampleLink } from "../../../dina-ui/components/collection/MaterialSampleAssociationsField";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { SampleListLayout } from "../../../dina-ui/pages/collection/material-sample/list";

export function AssociatedMaterialSampleSearchBoxField(
  props: FieldWrapperProps
) {
  return (
    <FieldWrapper
      readOnlyRender={value => value && <MaterialSampleLink id={value} />}
      hideLabel={true}
      disableLabelClick={true}
      {...props}
    >
      {fieldProps => <AssociatedMaterialSampleSearchBox {...fieldProps} />}
    </FieldWrapper>
  );
}

function AssociatedMaterialSampleSearchBox({
  invalid,
  setValue,
  value
}: FieldWrapperRenderProps) {
  const [showSearchAssociatedSample, setShowSearchAssociatedSample] =
    useState(false);

  const { formatMessage } = useDinaIntl();

  /** Clear the input value */
  function removeEntry() {
    setValue(undefined);
    setShowSearchAssociatedSample(false);
  }

  return (
    <div className={invalid ? "is-invalid" : ""}>
      <label className="w-100">
        <strong>{formatMessage("associatedMaterialSample")}</strong>{" "}
      </label>
      {value ? (
        <div>
          <div className="d-flex flex-column">
            <div className={"d-flex flex-row"}>
              <div
                className="flex-md-grow-1 form-control associated-sample-link"
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
          </div>
        </div>
      ) : showSearchAssociatedSample ? (
        <div
          className="p-2 mt-2 associated-sample-search"
          style={{ borderStyle: "dashed" }}
        >
          <div className="mb-4">
            <span className="me-2 fw-bold" style={{ fontSize: "1.2em" }}>
              {formatMessage("search")}
            </span>
            <button
              className="btn btn-dark"
              onClick={() => setShowSearchAssociatedSample(false)}
            >
              {formatMessage("closeButtonText")}
            </button>
          </div>
          <SampleListLayout
            onSelect={sample => setValue(sample.id)}
            classNames="btn btn-primary selectMaterialSample"
            btnMsg={formatMessage("select")}
            hideTopPagination={true}
            hideGroupFilter={true}
            openLinkInNewTab={true}
          />
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-secondary mb-2 col-md-4 searchSample"
          onClick={() => setShowSearchAssociatedSample(true)}
        >
          {formatMessage("search") + "..."}
        </button>
      )}
    </div>
  );
}
