import React from "react";
import Select from "react-select";
import titleCase from "title-case";
import { SeqdbMessage } from "../../intl/seqdb-intl";
import { FilterAttribute } from "./FilterBuilder";

export type FilterRowPredicate = "IS" | "IS NOT";
export type FilterRowSearchType =
  | "PARTIAL_MATCH"
  | "EXACT_MATCH"
  | "BLANK_FIELD";

export interface FilterRowModel {
  id: number;
  type: "FILTER_ROW";
  attribute: FilterAttribute;
  predicate: FilterRowPredicate;
  searchType: FilterRowSearchType;
  value: string;
}

export interface FilterRowProps {
  filterAttributes: FilterAttribute[];
  model: FilterRowModel;
  showRemoveButton: boolean;
  onAndClick: () => void;
  onChange: () => void;
  onRemoveClick: () => void;
  onOrClick: () => void;
}

export interface FilterAttributeOption {
  label: string;
  value: FilterAttribute;
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
      label: React.ReactNode;
      value: FilterRowSearchType;
    }> = [
      {
        label: <SeqdbMessage id="filterPartialMatch" />,
        value: "PARTIAL_MATCH"
      },
      { label: <SeqdbMessage id="filterExactMatch" />, value: "EXACT_MATCH" },
      { label: <SeqdbMessage id="filterBlankField" />, value: "BLANK_FIELD" }
    ];

    const attributeSelectOption = getSelectOption(model.attribute);

    const mappedfilterAttributes = this.props.filterAttributes.map(
      getSelectOption
    );

    return (
      <div className="list-inline">
        <div className="list-inline-item" style={{ width: 320 }}>
          <Select<FilterAttributeOption>
            className="filter-attribute"
            instanceId={`attribute_${model.id}`}
            options={mappedfilterAttributes}
            onChange={this.onPropertyChanged}
            value={attributeSelectOption}
          />
        </div>
        <div className="list-inline-item" style={{ width: 120 }}>
          <Select
            className="filter-predicate"
            instanceId={`predicate_${model.id}`}
            options={[
              { label: <SeqdbMessage id="IS" />, value: "IS" },
              { label: <SeqdbMessage id="ISNOT" />, value: "IS NOT" }
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
            className="list-inline-item btn btn-primary and"
            onClick={onAndClick}
            type="button"
          >
            <SeqdbMessage id="AND" />
          </button>
          <button
            className="list-inline-item btn btn-primary or"
            onClick={onOrClick}
            type="button"
          >
            <SeqdbMessage id="OR" />
          </button>
          {showRemoveButton && (
            <button
              className="list-inline-item btn btn-dark remove"
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

  private onPropertyChanged = (value: FilterAttributeOption) => {
    this.props.model.attribute = value.value;
    this.props.onChange();
    this.forceUpdate();
  };

  private onPredicateChanged = (value: {
    label: React.ReactNode;
    value: string;
  }) => {
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

function getSelectOption(attribute: FilterAttribute): FilterAttributeOption {
  return typeof attribute === "string"
    ? {
        label: titleCase(attribute),
        value: attribute
      }
    : {
        label: attribute.label || titleCase(attribute.name),
        value: attribute
      };
}
