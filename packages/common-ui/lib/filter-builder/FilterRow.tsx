import { isEqual, noop } from "lodash";
import React from "react";
import Select from "react-select";
import { CommonMessage } from "../intl/common-ui-intl";
import { FilterAttribute } from "./FilterBuilder";
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

    let filterPropertyType = "string";
    let resourceType;
    let filter;
    let optionLabel;
    const selectedAttribute = this.context.attributeOptions.find(option =>
      isEqual(option.value, model.attribute)
    );

    let predicateTypes: {
      label: React.ReactNode;
      value: FilterRowPredicate;
    }[] = [
      {
        label: <CommonMessage id="IS" />,
        value: "IS"
      },
      {
        label: <CommonMessage id="ISNOT" />,
        value: "IS NOT"
      }
    ];

    if (
      typeof model.attribute !== "string" &&
      model.attribute.type === "date"
    ) {
      filterPropertyType = "date";
    } else if (
      typeof model.attribute !== "string" &&
      model.attribute.type === "resource-dropdown"
    ) {
      filterPropertyType = "dropdown";
      resourceType = model.attribute.resourceType;
      filter =
        selectedAttribute && typeof selectedAttribute.value !== "string"
          ? selectedAttribute.value.filter
          : noop;
      optionLabel =
        selectedAttribute && typeof selectedAttribute.value !== "string"
          ? selectedAttribute.value.optionLabel
          : noop;
    }
    let searchTypes: {
      label: React.ReactNode;
      value: FilterRowSearchType;
    }[] = [
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

    if (filterPropertyType === "date") {
      predicateTypes = [
        {
          label: <CommonMessage id="filterGreaterThan" />,
          value: "GREATER_THAN"
        },
        {
          label: <CommonMessage id="filterLessThan" />,
          value: "LESS_THAN"
        }
      ];
    } else if (filterPropertyType === "dropdown") {
      searchTypes = [
        {
          label: <CommonMessage id="filterExactMatch" />,
          value: "EXACT_MATCH"
        }
      ];
    }
    return (
      <div className="list-inline row">
        <div className="list-inline-item" style={{ width: 320 }}>
          <Select<FilterAttributeOption>
            className="filter-attribute"
            instanceId={`attribute_${model.id}`}
            options={this.context.attributeOptions}
            onChange={this.onPropertyChanged}
            value={selectedAttribute}
          />
        </div>
        <div className="list-inline-item" style={{ width: 180 }}>
          <Select
            className="filter-predicate"
            instanceId={`predicate_${model.id}`}
            options={predicateTypes}
            onChange={this.onPredicateChanged}
            value={{ label: model.predicate, value: model.predicate }}
          />
        </div>

        {filterPropertyType === "date" && (
          <div className="list-inline-item" style={{ width: 180 }}>
            <DatePicker
              className="d-inline-block form-control"
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
        {filterPropertyType === "dropdown" && (
          <div
            className="form-control"
            style={{ width: 150, marginRight: 10, border: 0, marginTop: -5 }}
          >
            <ResourceSelect
              onChange={this.onSelectValueChanged}
              filter={filter}
              model={`agent-api/${resourceType}`}
              optionLabel={optionLabel}
              value={typeof model.value !== "string" ? model.value : undefined}
            />
          </div>
        )}

        {typeof this.props.model.attribute === "string" && (
          <input
            className="filter-value list-inline-item form-control w-auto d-inline-block"
            style={{
              visibility:
                model.searchType === "BLANK_FIELD" ? "hidden" : undefined
            }}
            value={typeof model.value === "string" ? model.value : undefined}
            onChange={this.onValueChanged}
          />
        )}
        {filterPropertyType !== "date" && (
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
    if (
      typeof this.props.model.attribute !== "string" &&
      this.props.model.attribute.type === "date"
    ) {
      this.props.model.value = moment().format();
      this.props.model.predicate = "GREATER_THAN";
    } else if (typeof this.props.model.attribute === "string") {
      this.props.model.value = "";
      this.props.model.searchType = "PARTIAL_MATCH";
      this.props.model.predicate = "IS";
    } else if (
      typeof this.props.model.attribute !== "string" &&
      this.props.model.attribute.type === "resource-dropdown"
    ) {
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
}
