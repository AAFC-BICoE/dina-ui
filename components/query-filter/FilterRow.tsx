import React from "react";
import Select from "react-select";

export type FilterRowPredicate = "IS" | "IS NOT";

export interface FilterRowModel {
  type: "FILTER_ROW";
  attribute: string;
  predicate: FilterRowPredicate;
  value: string;
}

export interface FilterRowProps {
  filterAttributes: string[];
  model: FilterRowModel;
  onAndClick: () => void;
  onOrClick: () => void;
}

export class FilterRow extends React.Component<FilterRowProps> {
  public render() {
    const { model, onAndClick, onOrClick } = this.props;

    return (
      <div className="list-inline">
        <div className="list-inline-item" style={{ width: 320 }}>
          <Select
            options={this.mappedfilterAttributes}
            onChange={this.onPropertyChanged}
            defaultValue={{ label: model.attribute, value: model.attribute }}
          />
        </div>
        <div className="list-inline-item" style={{ width: 120 }}>
          <Select
            options={[
              { label: "IS", value: "IS" },
              { label: "IS NOT", value: "IS NOT" }
            ]}
            onChange={this.onPredicateChanged}
            defaultValue={{ label: model.predicate, value: model.predicate }}
          />
        </div>
        <input
          className="filter-value list-inline-item"
          defaultValue={model.value}
          onChange={this.onValueChanged}
        />
        <button className="list-inline-item" onClick={onAndClick}>
          AND
        </button>
        <button className="list-inline-item" onClick={onOrClick}>
          OR
        </button>
      </div>
    );
  }

  get mappedfilterAttributes() {
    return this.props.filterAttributes.map(attr => ({
      label: attr,
      value: attr
    }));
  }

  private onPropertyChanged = (value: { label: string; value: string }) => {
    this.props.model.attribute = value.value;
  };

  private onPredicateChanged = (value: { label: string; value: string }) => {
    this.props.model.predicate = value.value as FilterRowPredicate;
  };

  private onValueChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.model.value = e.target.value;
  };
}
