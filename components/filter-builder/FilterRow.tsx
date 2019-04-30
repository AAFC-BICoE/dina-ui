import React from "react";
import Select from "react-select";
import titleCase from "title-case";

export type FilterRowPredicate = "IS" | "IS NOT";
export type FilterRowSearchType =
  | "PARTIAL_MATCH"
  | "EXACT_MATCH"
  | "BLANK_FIELD";

export interface FilterRowModel {
  id: number;
  type: "FILTER_ROW";
  attribute: string;
  predicate: FilterRowPredicate;
  searchType: FilterRowSearchType;
  value: string;
}

export interface FilterRowProps {
  filterAttributes: string[];
  model: FilterRowModel;
  showRemoveButton: boolean;
  onAndClick: () => void;
  onChange: () => void;
  onRemoveClick: () => void;
  onOrClick: () => void;
}

export class FilterRow extends React.Component<FilterRowProps> {
  public render() {
    const {
      model,
      onAndClick,
      onRemoveClick,
      onOrClick,
      showRemoveButton
    } = this.props;

    const searchTypes: Array<{
      label: string;
      value: FilterRowSearchType;
    }> = [
      { label: "Partial Match", value: "PARTIAL_MATCH" },
      { label: "Exact Match", value: "EXACT_MATCH" },
      { label: "Blank Field", value: "BLANK_FIELD" }
    ];

    return (
      <div className="list-inline">
        <div className="list-inline-item" style={{ width: 320 }}>
          <Select
            className="filter-attribute"
            instanceId={`attribute_${model.id}`}
            options={this.mappedfilterAttributes}
            onChange={this.onPropertyChanged}
            value={{
              label: titleCase(model.attribute),
              value: model.attribute
            }}
          />
        </div>
        <div className="list-inline-item" style={{ width: 120 }}>
          <Select
            className="filter-predicate"
            instanceId={`predicate_${model.id}`}
            options={[
              { label: "IS", value: "IS" },
              { label: "IS NOT", value: "IS NOT" }
            ]}
            onChange={this.onPredicateChanged}
            value={{ label: model.predicate, value: model.predicate }}
          />
        </div>
        <input
          className="filter-value list-inline-item form-control w-auto d-inline-block"
          style={{
            visibility:
              model.searchType === "BLANK_FIELD" ? "hidden" : undefined
          }}
          value={model.value}
          onChange={this.onValueChanged}
        />
        <div className="list-inline-item" style={{ width: 180 }}>
          <Select
            className="filter-search-type"
            instanceId={`searchType_${model.id}`}
            options={searchTypes}
            onChange={this.onSearchTypeChanged}
            value={searchTypes.find(
              option => option.value === model.searchType
            )}
          />
        </div>
        <div className="filter-row-buttons list-inline-item">
          <button
            className="list-inline-item btn btn-primary"
            onClick={onAndClick}
            type="button"
          >
            AND
          </button>
          <button
            className="list-inline-item btn btn-primary"
            onClick={onOrClick}
            type="button"
          >
            OR
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

  get mappedfilterAttributes() {
    return this.props.filterAttributes.map(attr => ({
      label: titleCase(attr),
      value: attr
    }));
  }

  private onPropertyChanged = (value: { label: string; value: string }) => {
    this.props.model.attribute = value.value;
    this.props.onChange();
    this.forceUpdate();
  };

  private onPredicateChanged = (value: { label: string; value: string }) => {
    this.props.model.predicate = value.value as FilterRowPredicate;
    this.props.onChange();
    this.forceUpdate();
  };

  private onSearchTypeChanged = (value: {
    label: string;
    value: FilterRowSearchType;
  }) => {
    this.props.model.searchType = value.value;
    this.props.onChange();
    this.forceUpdate();
  };

  private onValueChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.model.value = e.target.value;
    this.props.onChange();
    this.forceUpdate();
  };
}
