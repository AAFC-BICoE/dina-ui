import { filterBy } from "common-ui";
import { ResourceSelectField, TextField } from "common-ui";
import React from "react";
import { ManagedAttribute } from "types/objectstore-api/resources/ManagedAttribute";
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
  showPlusButton: boolean;
  onAndClick: () => void;
  onChange: () => void;
  onRemoveClick: () => void;
}

export class AttributeRow extends React.Component<AttributeRowProps> {
  public render() {
    const {
      showPlusButton,
      model,
      onAndClick,
      onRemoveClick,
      showRemoveButton,
      controlledAttributes
    } = this.props;

    return (
      <div className="list-inline">
        {controlledAttributes &&
        controlledAttributes[0] &&
        controlledAttributes[0].name &&
        controlledAttributes[0].name === "unManaged" ? (
          <div className=" col-md-7" style={{ width: 600 }}>
            <TextField name={`assignedValue_un${model.id}`} hideLabel={true} />
          </div>
        ) : (
          <div style={{ width: 800 }}>
            <div className="col-md-7">
              <ResourceSelectField<ManagedAttribute>
                name={`key_${model.id}`}
                filter={filterBy(["name"])}
                model="managed-attribute"
                optionLabel={managedAttribute => managedAttribute.name}
                hideLabel={true}
              />
            </div>
            <div className=" col-md-4">
              <TextField name={`assignedValue${model.id}`} hideLabel={true} />
            </div>
          </div>
        )}

        <div className=" col-sm-2">
          {showPlusButton && (
            <button
              className=" btn btn-primary"
              onClick={onAndClick}
              type="button"
            >
              +
            </button>
          )}

          {showRemoveButton && (
            <button
              className=" btn btn-dark"
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
