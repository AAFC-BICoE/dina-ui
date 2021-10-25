import React, { ChangeEvent, RefObject, useRef, useState } from "react";
import { TextField, TextFieldProps } from "./TextField";
import classNames from "classnames";
import { SampleListLayout } from "../../../dina-ui/pages/collection/material-sample/list";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { RiDeleteBinLine } from "react-icons/ri";

interface AssociatedMaterialSampleSearchBoxProps extends TextFieldProps {
  showSearchAssociatedSampleInit?: boolean;
}

export function AssociatedMaterialSampleSearchBox(
  props: AssociatedMaterialSampleSearchBoxProps
) {
  const { showSearchAssociatedSampleInit } = props;
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
        className={classNames("mt-2", !showSearchAssociatedSample && "d-none")}
        style={{ borderStyle: "dashed" }}
      >
        <div className="mb-2">
          <span className="me-2 fw-bold">{formatMessage("search")}</span>
          <a href="#association" onClick={onCloseClicked}>
            {formatMessage("closeButtonText")}
          </a>
        </div>
        <SampleListLayout
          onSelect={sample => onAssociatedSampleSelected(sample, onChange)}
          classNames="btn btn-primary selectMaterialSample"
          btnMsg={formatMessage("select")}
        />
      </div>
    );
  };

  const onAssociatedSampleSelected = (sample, onChange) => {
    if (inputRef.current) {
      inputRef.current.value = sample.id;
      onChange?.({
        target: { value: sample.id }
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
