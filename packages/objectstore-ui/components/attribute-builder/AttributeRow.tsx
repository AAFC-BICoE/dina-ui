import React from "react";
import { SelectField, TextField } from "../../lib";
import { ManagedAttribute } from "./AttributeBuilder";

export interface AttributeRowModel {
  id: number;
  type: "ATTRIBUTE_ROW";
  attribute: ManagedAttribute;
  value: string;
}

export interface AttributeRowProps {
  managedAttributes: ManagedAttribute[];
  model: AttributeRowModel;
  showRemoveButton: boolean;
  onAndClick: () => void;
  onChange: () => void;
  onRemoveClick: () => void;
}

export interface ManagedAttributeOption {
  label: string;
  value: ManagedAttribute;
}

export class AttributeRow extends React.Component<AttributeRowProps> {
  public render() {
    const { model, onAndClick, onRemoveClick, showRemoveButton } = this.props;

    const DC_TYPE_OPTIONS = [
      {
        label: "Image",
        value: "IMAGE"
      },
      {
        label: "Moving Image",
        value: "MOVING_IMAGE"
      },
      {
        label: "Sound",
        value: "SOUND"
      },
      {
        label: "Text",
        value: "TEXT"
      }
    ];

    return (
      <div className="list-inline">
        <div className="list-inline-item" style={{ width: 320 }}>
          <SelectField
            options={DC_TYPE_OPTIONS}
            name={`key_${model.id}`}
            className="col-md-2"
          />
        </div>
        <TextField
          name={`assignedValue${model.id}`}
          className="list-inline-item"
        />

        <div className="filter-row-buttons list-inline-item">
          <button
            className="list-inline-item btn btn-primary"
            onClick={onAndClick}
            type="button"
          >
            +
          </button>
          {showRemoveButton && (
            <button
              className="list-inline-item btn btn-dark"
              onClick={onRemoveClick}
              type="button"
            >
              -
            </button>
          )}
        </div>
      </div>
    );
  }
}
