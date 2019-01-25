import { isEqual, pull } from "lodash";
import React from "react";
import { FilterGroup, FilterGroupModel } from "./FilterGroup";
import { FilterRow, FilterRowModel } from "./FilterRow";

interface FilterBuilderProps {
  filterAttributes: string[];
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

  constructor(props) {
    super(props);
    this.state = {
      model: {
        children: [
          {
            attribute: "name",
            id: this.getNewFilterId(),
            predicate: "IS",
            type: "FILTER_ROW",
            value: ""
          }
        ],
        id: this.getNewFilterId(),
        operator: "AND",
        type: "FILTER_GROUP"
      }
    };
  }

  /**
   * React component's render method. This component can recursively render FilterGroups and
   * FilterRows.
   */
  public render() {
    return this.renderFilter({
      model: this.state.model,
      parent: this.state.model
    });
  }

  /**
   * Gets a new unique filter ID to be passed into child components' "key" props.
   */
  private getNewFilterId() {
    return ++this.filterIdIncrementor;
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
    after: FilterRowModel | FilterGroupModel;
    parent: FilterGroupModel;
    operator: "AND" | "OR";
  }) {
    const newFilterRow: FilterRowModel = {
      attribute: "name",
      id: this.getNewFilterId(),
      predicate: "IS",
      type: "FILTER_ROW",
      value: ""
    };

    if (operator === parent.operator) {
      parent.children.splice(
        parent.children.indexOf(after) + 1,
        0,
        newFilterRow
      );
    } else {
      parent.children[parent.children.indexOf(after)] = {
        children: [after, newFilterRow],
        id: this.getNewFilterId(),
        operator,
        type: "FILTER_GROUP"
      };
    }

    this.flattenModel(this.state.model);

    // Re-render the component.
    this.setState({});
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
    parent.children = pull(parent.children, filter);

    this.flattenModel(this.state.model);

    // Re-render the component.
    this.setState({});
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
      .filter(child => child.type === "FILTER_GROUP")
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
      case "FILTER_GROUP":
        const children = model.children.map(child =>
          this.renderFilter({ model: child, parent: model })
        );

        return (
          <FilterGroup
            key={model.id}
            model={model}
            onAndClick={onAndClick}
            onOrClick={onOrClick}
          >
            {children}
          </FilterGroup>
        );
      case "FILTER_ROW":
        // Don't show the remove button when this is the only FilterRow.
        const showRemoveButton = !isEqual(this.state.model.children, [model]);

        return (
          <FilterRow
            key={model.id}
            model={model}
            onAndClick={onAndClick}
            onRemoveClick={onRemoveClick}
            onOrClick={onOrClick}
            filterAttributes={this.props.filterAttributes}
            showRemoveButton={showRemoveButton}
          />
        );
    }
  }
}
