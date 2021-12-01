import React  from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import { FieldWrapper} from "..";
import { MaterialSampleLink } from "../../../dina-ui/components/collection/MaterialSampleAssociationsField";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { SampleListLayout } from "../../../dina-ui/pages/collection/material-sample/list";
import classNames from "classnames";

export function AssociatedMaterialSampleSearchBoxField({
  showSearchBtn,
  listRef,
  props
}) {
  const { formatMessage } = useDinaIntl();

  function onSearchClicked() {
    if (listRef.current) {
      listRef.current.className = listRef.current.className.replace(
        "d-none",
        ""
      );
    }
  }  

  return (
    <div>
      <label className="w-100">
        <strong>{formatMessage("associatedMaterialSample")}</strong>{" "}
      </label>
      <div className="list-inline d-flex flex-row gap-2 pt-2">
          <FieldWrapper
            {...props}
            removeLabel={true}
            removeLabelTag={true}
            disableLabelClick={true}
          >
            {({ setValue, value }) => {
              /** Clear the input value */
              function removeEntry() {
                setValue(null);
                if (listRef.current) {
                  listRef.current.className =
                    listRef.current.className.replaceAll("d-none", "");
                }
              }
              return (
                <>
                  <div className={"row mb-2"}>
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
                          style={{
                            backgroundColor: "#e9ecef",
                            minWidth: "100px"
                          }}
                        >
                          {value && <MaterialSampleLink id={value} />}
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
  listRef,
  onAssociatedSampleSelected
}) {
  const { formatMessage } = useDinaIntl();
  function onCloseClicked() {
    if (listRef.current) {
      listRef.current.className = listRef.current.className + " d-none";
    }
  }
  return (
    <div
      ref={listRef}
      className={classNames("p-2 mt-2 d-none")}
      style={{ borderStyle: "dashed" }}
    >
      <div className="mb-4">
        <span className="me-2 fw-bold" style={{ fontSize: "1.2em" }}>
          {formatMessage("search")}
        </span>
        <button className="btn btn-dark" type="button" onClick={onCloseClicked}>
          {formatMessage("closeButtonText")}
        </button>
      </div>
      <SampleListLayout
        onSelect={onAssociatedSampleSelected}
        classNames="btn btn-primary associated-sample-search"
        btnMsg={formatMessage("select")}
        hideTopPagination={true}
        hideGroupFilter={true}
      />
    </div>
  );
}
