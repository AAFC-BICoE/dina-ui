import React from "react";
import Select from "react-select";
import { CommonMessage } from "../intl/common-ui-intl";
import { FilterAttribute, FilterAttributeConfig } from "./FilterBuilder";
import {
  FilterBuilderContext,
  FilterBuilderContextI
} from "./FilterBuilderContext";
import DatePicker from "react-datepicker";
import moment from "moment";
import { ResourceSelect } from "../resource-select/ResourceSelect";
import { KitsuResource } from "kitsu";

export type FilterRowPredicate = "IS" | "IS NOT" | "GREATER_THAN" | "LESS_THAN";
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
  value: string | KitsuResource;
}

export interface FilterRowProps {
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

type DropdownOption<TValue> = {
  label: React.ReactNode;
  value: TValue;
};

export class FilterRow extends React.Component<FilterRowProps> {
  public static contextType = FilterBuilderContext;
  public context!: FilterBuilderContextI;

  public render() {
    const {
      model,
      onAndClick,
      onRemoveClick,
      onOrClick,
      showRemoveButton
    } = this.props;

    // If only a string is passed, create the default attribute config object:
    const attribute = this.attributeConfig();

    // Get the selected Filter Attribute from the parent FilterBuilder's list:
    const selectedAttributeOption = this.context.attributeOptions.find(
      option => {
        const optionAttrString =
          typeof option.value === "string" ? option.value : option.value.name;

        return attribute.name === optionAttrString;
      }
    );

    /** The predicate types to put into the dropdown. */
    const predicateTypes =
      attribute.type === "DATE"
        ? DATE_PREDICATE_OPTIONS
        : BOOLEAN_PREDICATE_OPTIONS;

    const searchTypes =
      attribute.type === "DROPDOWN"
        ? SEARCH_TYPES_EXACT_ONLY
        : STRING_SEARCH_TYPES;

    return (
      <div className="list-inline row">
        <div className="list-inline-item" style={{ width: 320 }}>
          <Select<FilterAttributeOption>
            className="filter-attribute"
            instanceId={`attribute_${model.id}`}
            options={this.context.attributeOptions}
            onChange={this.onPropertyChanged}
            value={selectedAttributeOption}
          />
        </div>
        <div className="list-inline-item" style={{ width: 180 }}>
          <Select
            className="filter-predicate"
            instanceId={`predicate_${model.id}`}
            options={predicateTypes}
            onChange={this.onPredicateChanged}
            value={predicateTypes.find(
              option => option.value === model.predicate
            )}
          />
        </div>

        {attribute.type === "DATE" && (
          <div className="list-inline-item" style={{ width: "15rem" }}>
            <DatePicker
              className="d-inline-block form-control"
              wrapperClassName="w-100"
              selected={
                typeof model.value === "string"
                  ? isNaN(Date.parse(model.value))
                    ? new Date()
                    : new Date(model.value)
                  : null
              }
              onChange={this.onDateValueChanged}
            />
          </div>
        )}
        {attribute.type === "DROPDOWN" && (
          <div className="list-inline-item" style={{ width: "15rem" }}>
            <ResourceSelect
              onChange={this.onSelectValueChanged}
              filter={attribute.filter ?? (() => ({}))}
              model={attribute.resourcePath ?? ""}
              optionLabel={attribute.optionLabel ?? (() => "---")}
              value={typeof model.value !== "string" ? model.value : undefined}
            />
          </div>
        )}

        {attribute.type === "STRING" && (
          <input
            className="filter-value list-inline-item form-control d-inline-block"
            style={{
              width: "15rem",
              visibility:
                model.searchType === "BLANK_FIELD" ? "hidden" : undefined
            }}
            value={typeof model.value === "string" ? model.value : undefined}
            onChange={this.onValueChanged}
          />
        )}
        {attribute.type !== "DATE" && (
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
        )}
        <div className="filter-row-buttons list-inline-item">
          <button
            className="list-inline-item btn btn-primary and"
            onClick={onAndClick}
            type="button"
          >
            <CommonMessage id="AND" />
          </button>
          <button
            className="list-inline-item btn btn-primary or"
            onClick={onOrClick}
            type="button"
          >
            <CommonMessage id="OR" />
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

    const attribute = this.attributeConfig();

    if (attribute.type === "DATE") {
      this.props.model.value = moment().format();
      this.props.model.predicate = "GREATER_THAN";
    } else if (attribute.type === "STRING") {
      this.props.model.value = "";
      this.props.model.searchType = "PARTIAL_MATCH";
      this.props.model.predicate = "IS";
    } else if (attribute.type === "DROPDOWN") {
      this.props.model.searchType = "EXACT_MATCH";
      this.props.model.predicate = "IS";
    }

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

  private onSelectValueChanged = e => {
    this.props.model.value = e;
    this.props.onChange();
    this.forceUpdate();
  };

  private onDateValueChanged = e => {
    this.props.model.value = moment(e).format();
    this.props.onChange();
    this.forceUpdate();
  };

  /** Gets the passed attribute prop (string or object) as a full FilterAttributeConfig object. */
  private attributeConfig(): FilterAttributeConfig {
    const { model } = this.props;

    const selectedAttribute =
      this.context.attributeOptions.find(option => {
        const propAttributeName =
          typeof model.attribute === "string"
            ? model.attribute
            : model.attribute.name;
        const optionAttrString =
          typeof option.value === "string" ? option.value : option.value.name;

        return propAttributeName === optionAttrString;
      }) ?? this.context.attributeOptions[0];

    return typeof selectedAttribute.value === "string"
      ? {
          name: selectedAttribute.value,
          type: "STRING"
        }
      : selectedAttribute.value;
  }
}

/** Predicate dropdown options for filtering on date attributes. */
const BOOLEAN_PREDICATE_OPTIONS: DropdownOption<FilterRowPredicate>[] = [
  {
    label: <CommonMessage id="IS" />,
    value: "IS"
  },
  {
    label: <CommonMessage id="ISNOT" />,
    value: "IS NOT"
  }
];

/** Predicate dropdown options for filtering on date attributes. */
const DATE_PREDICATE_OPTIONS: DropdownOption<FilterRowPredicate>[] = [
  {
    label: <CommonMessage id="filterGreaterThan" />,
    value: "GREATER_THAN"
  },
  {
    label: <CommonMessage id="filterLessThan" />,
    value: "LESS_THAN"
  }
];

/** Search types for String searches */
const STRING_SEARCH_TYPES: DropdownOption<FilterRowSearchType>[] = [
  {
    label: <CommonMessage id="filterPartialMatch" />,
    value: "PARTIAL_MATCH"
  },
  {
    label: <CommonMessage id="filterExactMatch" />,
    value: "EXACT_MATCH"
  },
  {
    label: <CommonMessage id="filterBlankField" />,
    value: "BLANK_FIELD"
  }
];

/** Search types for attributes that only support exact matching. */
const SEARCH_TYPES_EXACT_ONLY: DropdownOption<FilterRowSearchType>[] = [
  {
    label: <CommonMessage id="filterExactMatch" />,
    value: "EXACT_MATCH"
  }
];
