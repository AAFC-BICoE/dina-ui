import React from "react";
import { FilterGroup, FilterGroupModel } from "./FilterGroup";
import { FilterRow, FilterRowModel } from "./FilterRow";

interface FilterBuilderState {
  rootFilterGroup: FilterGroupModel;
}

export class FilterBuilder extends React.Component<{}, FilterBuilderState> {
  constructor(props) {
    super(props);
    this.state = {
      rootFilterGroup: {
        children: [
          {
            predicate: "IS",
            property: "name",
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
      filterUnit: this.state.rootFilterGroup,
      parent: this.state.rootFilterGroup
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
      predicate: "IS",
      property: "name",
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

    this.setState({});
  }

  private renderFilter({
    filterUnit,
    parent
  }: {
    filterUnit: FilterGroupModel | FilterRowModel;
    parent: FilterGroupModel;
  }): JSX.Element {
    const filterUnitModel = filterUnit;

    const onAndClick = () => {
      this.addFilterRow({
        after: filterUnitModel,
        operator: "AND",
        parent
      });
    };

    const onOrClick = () => {
      this.addFilterRow({
        after: filterUnitModel,
        operator: "OR",
        parent
      });
    };

    switch (filterUnitModel.type) {
      case "FILTER_GROUP":
        return (
          <FilterGroup
            model={filterUnitModel}
            onAndClick={onAndClick}
            onOrClick={onOrClick}
          >
            {filterUnitModel.children.map(child =>
              this.renderFilter({ filterUnit: child, parent: filterUnitModel })
            )}
          </FilterGroup>
        );
      case "FILTER_ROW":
        return (
          <FilterRow
            model={filterUnitModel}
            onAndClick={onAndClick}
            onOrClick={onOrClick}
          />
        );
    }
  }
}
