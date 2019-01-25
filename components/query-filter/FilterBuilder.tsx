import { pull } from "lodash";
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

  public render() {
    return this.renderFilter({
      model: this.state.model,
      parent: this.state.model
    });
  }

  private getNewFilterId() {
    return ++this.filterIdIncrementor;
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
    this.setState({});
  }

  private removeFilter({
    filter,
    parent
  }: {
    filter: FilterRowModel | FilterGroupModel;
    parent: FilterGroupModel;
  }) {
    parent.children = pull(parent.children, filter);

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
        return (
          <FilterRow
            key={model.id}
            model={model}
            onAndClick={onAndClick}
            onRemoveClick={onRemoveClick}
            onOrClick={onOrClick}
            filterAttributes={this.props.filterAttributes}
          />
        );
    }
  }
}
