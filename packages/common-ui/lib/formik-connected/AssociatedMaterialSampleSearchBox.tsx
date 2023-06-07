import classNames from "classnames";
import { FastField } from "formik";
import React from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import { FieldWrapper } from "..";
import { MaterialSampleLink } from "../../../dina-ui/components";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { SampleListLayout } from "../../../dina-ui/pages/collection/material-sample/list";

export function AssociatedMaterialSampleSearchBoxField({
  showSearchBtn,
  onSearchClicked,
  onRemoveEntry,
  props
}) {
  const { formatMessage } = useDinaIntl();

  function defaultReadOnlyRender(value) {
    return value && <MaterialSampleLink id={value} />;
  }

  return (
    <div>
      <div className="list-inline d-flex flex-row gap-2 pt-2">
        <FieldWrapper
          {...props}
          disableLabelClick={true}
          readOnlyRender={(value, _) => defaultReadOnlyRender(value)}
        >
          {({ setValue, value, invalid }) => {
            /** Clear the input value */
            function removeEntry() {
              setValue(null);
              onRemoveEntry();
            }
            return (
              <>
                <div
                  className={classNames("row mb-2", invalid && "is-invalid")}
                >
                  {showSearchBtn ? (
                    <button
                      type="button"
                      className="btn btn-secondary form-control mx-2 searchSample"
                      onClick={() => onSearchClicked()}
                    >
                      {formatMessage("search") + "..."}
                    </button>
                  ) : (
                    <div className="d-flex flex-row">
                      <div
                        className="form-control associated-sample-link "
                        style={{ minWidth: "100px" }}
                      >
                        {defaultReadOnlyRender(value)}
                      </div>
                      <button
                        className="btn"
                        onClick={removeEntry}
                        type="button"
                        style={{
                          cursor: "pointer"
                        }}
                      >
                        <RiDeleteBinLine size="1.8em" className="ms-auto" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            );
          }}
        </FieldWrapper>
      </div>
    </div>
  );
}

export function MaterialSampleSearchHelper({
  showSearch,
  fieldName,
  onAssociatedSampleSelected,
  onCloseClicked
}) {
  const { formatMessage } = useDinaIntl();

  return showSearch ? (
    <div className="p-2 mt-2" style={{ borderStyle: "dashed" }}>
      <div className="mb-4">
        <span className="me-2 fw-bold" style={{ fontSize: "1.2em" }}>
          {formatMessage("search")}
        </span>
        <button className="btn btn-dark" type="button" onClick={onCloseClicked}>
          {formatMessage("closeButtonText")}
        </button>
      </div>
      {/** The table is expensive to render, so avoid unnecessary re-renders with FastField. */}
      <FastField name={fieldName}>
        {() => (
          <SampleListLayout
            onSelect={onAssociatedSampleSelected}
            classNames="btn btn-primary associated-sample-search"
            btnMsg={formatMessage("select")}
            hideTopPagination={true}
            hideGroupFilter={true}
          />
        )}
      </FastField>
    </div>
  ) : null;
}
