import _ from "lodash";
import React from "react";
import { FilterBuilderContextProvider } from "./FilterBuilderContext";
import {
  FilterGroup,
  FilterGroupModel,
  FilterGroupOperator
} from "./FilterGroup";
import { FilterRow, FilterRowModel } from "./FilterRow";
import { PersistedResource, FilterParam } from "kitsu";

export type FilterAttribute = string | FilterAttributeConfig;

export interface FilterAttributeConfig {
  name: string;
  label?: string;

  /**
   * If enabled, ranges will be split into greater than and less than parts.
   *
   * Can be combined with allowList option as well.
   */
  allowRange?: boolean;

  /**
   * If enabled, any commas will be automatically inserted into a IN query.
   */
  allowList?: boolean;

  /** Only needed for date or dropdown filters. */
  type?: FilterAttributeType;

  // Only needed for dropdown filters:
  resourcePath?: string;
  filter?: (inputValue: string) => FilterParam;
  optionLabel?: (resource: PersistedResource) => string;
}

export type FilterAttributeType = "DATE" | "DROPDOWN" | "STRING";

export interface FilterBuilderProps {
  filterAttributes: FilterAttribute[];
  value?: FilterGroupModel | null;
  onChange?: (state: FilterGroupModel) => void;
}

export interface FilterBuilderState {
  model: FilterGroupModel;
}

/**
 * UI component for building a query filter.
 */
export class FilterBuilder extends React.Component<
  FilterBuilderProps,
  FilterBuilderState
> {
  /**
   * Every child filter row and group needs a unique Id to be passed into child components'
   * "key" props.
   * This value is incremented for every new filter row or group.
   */
  private filterIdIncrementor = 0;

  constructor(props: FilterBuilderProps) {
    super(props);
    this.state = {
      model: props.value || this.getInitialModel()
    };
  }

  public async componentDidMount() {
    // Call the onChange callback to pass up the initial state on mount.
    await Promise.resolve();
    this.onChange();
  }

  public componentDidUpdate() {
    const { onChange, value } = this.props;

    // When a blank value is passed, reset the model to the initial state.
    if (Object.keys(this.props).includes("value") && !value && onChange) {
      const newModel = this.getInitialModel();
      this.setState({ model: newModel });
      onChange(newModel);
    }
  }

  /**
   * React component's render method. This component can recursively render FilterGroups and
   * FilterRows.
   */
  public render() {
    return (
      <div className="filter-builder">
        <FilterBuilderContextProvider
          filterAttributes={this.props.filterAttributes}
        >
          {this.renderFilter({
            model: this.state.model,
            parent: this.state.model
          })}
        </FilterBuilderContextProvider>
      </div>
    );
  }

  /**
   * Gets a new unique filter ID to be passed into child components' "key" props.
   */
  private getNewFilterId() {
    return ++this.filterIdIncrementor;
  }

  /**
   * The default filter builder model when this component is created.
   * It should be a filter group with one child blank filter row.
   */
  private getInitialModel(): FilterGroupModel {
    return {
      children: [
        {
          attribute: this.props.filterAttributes[0],
          id: this.getNewFilterId(),
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: ""
        }
      ],
      id: this.getNewFilterId(),
      operator: "AND",
      type: "FILTER_GROUP"
    };
  }

  /**
   * Adds a new FilterRow to the model. A new FilterGroup is added if the operator is different
   * than the clicked button's FilterRow's parent group's operator.
   */
  private addFilterRow({
    after,
    parent,
    operator
  }: {
    /** The filter to add a new one after, e.g. the filter with the clicked button. */
    after: FilterRowModel | FilterGroupModel;
    /** The new filter's parent group. */
    parent: FilterGroupModel;
    /** The new filter group's operator. */
    operator: FilterGroupOperator;
  }) {
    const newFilterRow: FilterRowModel = {
      attribute: this.props.filterAttributes[0],
      id: this.getNewFilterId(),
      predicate: "IS",
      searchType: "PARTIAL_MATCH",
      type: "FILTER_ROW",
      value: ""
    };

    // When the clicked button's operatoris the same as the parent group, just add a new row to
    // the existing group instead of creating a new group.
    if (operator === parent.operator) {
      parent.children.splice(
        parent.children.indexOf(after) + 1,
        0,
        newFilterRow
      );
    } else {
      const rootGroupButtonWasClicked = this.state.model === after;

      // When the root Group's AND/OR button was clicked, surround the filter with a new root group.
      if (rootGroupButtonWasClicked) {
        this.setState((state) => ({
          model: {
            children: [state.model, newFilterRow],
            id: this.getNewFilterId(),
            operator,
            type: "FILTER_GROUP"
          }
        }));
      } else {
        // Otherwise create a new group within the parent group.
        parent.children[parent.children.indexOf(after)] = {
          children: [after, newFilterRow],
          id: this.getNewFilterId(),
          operator,
          type: "FILTER_GROUP"
        };
      }
    }

    this.flattenModel(this.state.model);

    // Re-render the component.
    this.forceUpdate();
    this.onChange();
  }

  /**
   * Removes a filter row.
   */
  private removeFilter({
    filter,
    parent
  }: {
    filter: FilterRowModel | FilterGroupModel;
    parent: FilterGroupModel;
  }) {
    // Remove the filter row from the parent's children array.
    parent.children = _.pull(parent.children, filter);

    this.flattenModel(this.state.model);

    // Re-render the component.
    this.forceUpdate();
    this.onChange();
  }

  /**
   * Removes filter groups that only have one child. This method is used as cleanup after
   * adding or removing a filter row.
   *
   * @param model The group model to flatten.
   */
  private flattenModel(model: FilterGroupModel) {
    const children = model.children;

    if (
      // Groups with one child should be flattened.
      children.length === 1 &&
      // The root model should be a FilterGroupModel, so don't flatten it when its only child
      // is a FilterRow.
      !(model === this.state.model && children[0].type === "FILTER_ROW")
    ) {
      // Remove all attributes from the group.
      for (const attr of Object.keys(model)) {
        delete model[attr];
      }
      // Assign all values from the child to the group. This will replace the group model with
      // the data from the child FilterRow or FilterGroup.
      Object.assign(model, children[0]);
    }

    children
      .filter((child) => child.type === "FILTER_GROUP")
      .forEach((group: FilterGroupModel) => this.flattenModel(group));
  }

  /**
   * Renders either a FilterRow or FilterGroup depending on the given model.
   */
  private renderFilter({
    model,
    parent
  }: {
    model: FilterGroupModel | FilterRowModel;
    parent: FilterGroupModel;
  }): JSX.Element {
    const onAndClick = () => {
      this.addFilterRow({
        after: model,
        operator: "AND",
        parent
      });
    };

    const onOrClick = () => {
      this.addFilterRow({
        after: model,
        operator: "OR",
        parent
      });
    };

    const onRemoveClick = () => {
      this.removeFilter({
        filter: model,
        parent
      });
    };

    switch (model.type) {
      case "FILTER_GROUP": {
        const children = model.children.map((child) =>
          this.renderFilter({ model: child, parent: model })
        );

        const isRootGroup = this.state.model === model;

        // Only show the remove button when the FilterGroup is not the top-level group.
        const showRemoveButton = !isRootGroup;

        // Only show the AND/OR buttons when the FilterGroup is not the top-level group
        // with only one child, which would be a single filter row.
        const showAndOrButtons = !(isRootGroup && model.children.length === 1);

        return (
          <FilterGroup
            key={model.id}
            model={model}
            onAndClick={onAndClick}
            onOrClick={onOrClick}
            onRemoveClick={onRemoveClick}
            showAndOrButtons={showAndOrButtons}
            showRemoveButton={showRemoveButton}
          >
            {children}
          </FilterGroup>
        );
      }
      case "FILTER_ROW": {
        // Don't show the remove button when this is the only FilterRow.
        const showRemoveButton = !_.isEqual(this.state.model.children, [model]);

        return (
          <FilterRow
            key={model.id}
            model={model}
            onAndClick={onAndClick}
            onChange={this.onChange}
            onRemoveClick={onRemoveClick}
            onOrClick={onOrClick}
            showRemoveButton={showRemoveButton}
          />
        );
      }
    }
  }

  private onChange = () => {
    const { onChange = () => undefined } = this.props;
    onChange(this.state.model);
  };
}
