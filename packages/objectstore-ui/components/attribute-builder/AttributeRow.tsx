import { filterBy } from "common-ui";
import React from "react";
import { ManagedAttribute } from "types/objectstore-api/resources/ManagedAttribute";
import { ResourceSelectField, TextField } from "../../lib";
import { ControlledAttribute } from "./AttributeBuilder";

export interface AttributeRowModel {
  id: number;
  type: "ATTRIBUTE_ROW";
  attribute: ControlledAttribute;
  value: string;
}

export interface AttributeRowProps {
  controlledAttributes: ControlledAttribute[];
  model: AttributeRowModel;
  showRemoveButton: boolean;
  onAndClick: () => void;
  onChange: () => void;
  onRemoveClick: () => void;
}

export interface ManagedAttributeOption {
  label: string;
  value: ControlledAttribute;
}

export class AttributeRow extends React.Component<AttributeRowProps> {
  public render() {
    const { model, onAndClick, onRemoveClick, showRemoveButton } = this.props;

    return (
      <div className="list-inline">
        <div className="list-inline-item col-sm-6" style={{ width: 320 }}>
          <ResourceSelectField<ManagedAttribute>
            name={`key_${model.id}`}
            filter={filterBy(["name"])}
            model="managed-attribute"
            optionLabel={managedAttribute => managedAttribute.name}
          />
        </div>
        <div className="list-inline-item" style={{ width: 180 }}>
          <TextField name={`assignedValue${model.id}`} />
        </div>

        <div className="filter-row-buttons list-inline-item">
          {model.id === 1 && (
            <button
              className="list-inline-item btn btn-primary"
              onClick={onAndClick}
              type="button"
            >
              +
            </button>
          )}

          {showRemoveButton && model.id !== 1 && (
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
