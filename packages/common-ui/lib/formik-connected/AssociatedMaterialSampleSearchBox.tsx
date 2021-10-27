import React, { ChangeEvent, MutableRefObject, useRef, useState } from "react";
import { TextField, TextFieldProps } from "./TextField";
import classNames from "classnames";
import { SampleListLayout } from "../../../dina-ui/pages/collection/material-sample/list";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { RiDeleteBinLine } from "react-icons/ri";
import { MaterialSample } from "../../../dina-ui/types/collection-api/resources/MaterialSample";
import { FormikContextType } from "formik";

interface AssociatedMaterialSampleSearchBoxProps extends TextFieldProps {
  showSearchAssociatedSampleInit?: boolean;
  form?: FormikContextType<MaterialSample>;
  associatedSampleMapRef?: MutableRefObject<Map<string, string>>;
}

export function AssociatedMaterialSampleSearchBox(
  props: AssociatedMaterialSampleSearchBoxProps
) {
  const { showSearchAssociatedSampleInit, associatedSampleMapRef } = props;
  const [showSearchAssociatedSample, setShowSearchAssociatedSample] = useState(
    showSearchAssociatedSampleInit
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { formatMessage } = useDinaIntl();

  function onSearchClicked() {
    setShowSearchAssociatedSample(true);
  }

  /* Clear the input value */
  const removeEntry = onChange => {
    onChange?.({
      target: { value: "" }
    } as ChangeEvent<HTMLInputElement>);
    setShowSearchAssociatedSample(false);
  };

  const MaterialSampleList = ({ onChange }) => {
    function onCloseClicked() {
      if (listRef.current)
        listRef.current.className = listRef.current.className + " d-none";
    }
    return (
      <div
        ref={listRef}
        className={classNames(
          "p-2 mt-2",
          !showSearchAssociatedSample && "d-none"
        )}
        style={{ borderStyle: "dashed" }}
      >
        <div className="mb-4">
          <span className="me-2 fw-bold" style={{ fontSize: "1.2em" }}>
            {formatMessage("search")}
          </span>
          <a href="#association" onClick={onCloseClicked}>
            <span style={{ fontSize: "1.2em" }}>
              {formatMessage("closeButtonText")}{" "}
            </span>
          </a>
        </div>
        <SampleListLayout
          onSelect={sample => onAssociatedSampleSelected(sample, onChange)}
          classNames="btn btn-primary selectMaterialSample"
          btnMsg={formatMessage("select")}
          hideTopPagination={true}
        />
      </div>
    );
  };

  const onAssociatedSampleSelected = (sample, onChange) => {
    if (inputRef.current) {
      const sampleId = !!sample.materialSampleName?.length
        ? sample.materialSampleName
        : sample.id;
      inputRef.current.value = sampleId;
      if (associatedSampleMapRef?.current) {
        associatedSampleMapRef.current.set(sampleId, sample.id);
      }
      onChange?.({
        target: { value: sampleId }
      } as ChangeEvent<HTMLInputElement>);
    }
  };

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
          <TextField
            {...props}
            hideLabel={true}
            customInput={inputProps => (
              <div className="d-flex flex-column">
                <div className={"d-flex flex-row"}>
                  <input
                    {...inputProps}
                    type="text"
                    className={
                      "flex-md-grow-1 form-control associatedSampleInput"
                    }
                    ref={inputRef}
                  />
                  <button
                    className="btn mb-2"
                    onClick={() => removeEntry(inputProps.onChange)}
                    type="button"
                    style={{
                      cursor: "pointer"
                    }}
                  >
                    <RiDeleteBinLine size="1.8em" className="ms-auto" />
                  </button>
                </div>
                <MaterialSampleList onChange={inputProps.onChange} />
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
