import React from "react";
import { FilterGroup, FilterGroupModel } from "./FilterGroup";
import { FilterRow, FilterRowModel } from "./FilterRow";

interface FilterBuilderProps {
  filterAttributes: string[];
}

interface FilterBuilderState {
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

    this.setState({});
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
        return (
          <FilterGroup
            model={model}
            onAndClick={onAndClick}
            onOrClick={onOrClick}
          >
            {model.children.map(child =>
              this.renderFilter({ model: child, parent: model })
            )}
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
