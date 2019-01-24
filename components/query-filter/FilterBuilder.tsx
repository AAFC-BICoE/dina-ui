import React from "react";
import { FilterGroup, FilterGroupModel } from "./FilterGroup";
import { FilterRow, FilterRowModel } from "./FilterRow";

interface FilterBuilderProps {
  filterAttributes: string[];
}

export interface FilterBuilderState {
  model: FilterGroupModel;
}

export class FilterBuilder extends React.Component<
  FilterBuilderProps,
  FilterBuilderState
> {
  constructor(props) {
    super(props);
    this.state = {
      model: {
        children: [
          {
            attribute: "name",
            predicate: "IS",
            type: "FILTER_ROW",
            value: ""
          }
        ],
        operator: "AND",
        type: "FILTER_GROUP"
      }
    };
  }

  public render() {
    return this.renderFilter({
      model: this.state.model,
      parent: this.state.model
    });
  }

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
      predicate: "IS",
      type: "FILTER_ROW",
      value: ""
    };

    if (operator === parent.operator) {
      parent.children.push(newFilterRow);
    } else {
      parent.children[parent.children.indexOf(after)] = {
        children: [after, newFilterRow],
        operator,
        type: "FILTER_GROUP"
      };
    }

    this.flattenModel(this.state.model);

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

    if (children.length === 1 && children[0].type === "FILTER_GROUP") {
      const childGroup = children[0] as FilterGroupModel;
      model.children = childGroup.children;
      model.operator = childGroup.operator;
    } else {
      children
        .filter(child => child.type === "FILTER_GROUP")
        .forEach((group: FilterGroupModel) => this.flattenModel(group));
    }
  }

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

    switch (model.type) {
      case "FILTER_GROUP":
        const children = model.children.map(child =>
          this.renderFilter({ model: child, parent: model })
        );

        return (
          <FilterGroup
            model={model}
            onAndClick={onAndClick}
            onOrClick={onOrClick}
          >
            {children}
          </FilterGroup>
        );
      case "FILTER_ROW":
        return (
          <FilterRow
            model={model}
            onAndClick={onAndClick}
            onOrClick={onOrClick}
            filterAttributes={this.props.filterAttributes}
          />
        );
    }
  }
}
