import { isEqual, pull } from "lodash";
import React from "react";
import {
  // AttributeGroup,
  AttributeGroup,
  AttributeGroupModel
} from "./AttributeGroup";
import { AttributeRow, AttributeRowModel } from "./AttributeRow";

export interface ControlledAttribute {
  name: string;
  value: string;
}

export interface AttributeBuilderProps {
  controlledAttributes: ControlledAttribute[];
  value?: AttributeGroupModel;
  onChange?: (state: AttributeGroupModel) => void;
}

export interface AttributeBuilderState {
  model: AttributeGroupModel;
}

/**
 * UI component for building attributes.
 */
export class AttributeBuilder extends React.Component<
  AttributeBuilderProps,
  AttributeBuilderState
> {
  /**
   * Every child attribute row and group needs a unique Id to be passed into child components'
   * "key" props.
   * This value is incremented for every new attribute row.
   */
  private attributeIdIncrementor = 0;

  constructor(props: AttributeBuilderProps) {
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
   * React component's render method. This component can recursively render AttributeGroups and
   * AttributeRows.
   */
  public render() {
    return this.renderAttribute({
      model: this.state.model,
      parent: this.state.model
    });
  }

  /**
   * Gets a new unique attribute ID to be passed into child components' "key" props.
   */
  private getNewAttributeId() {
    return ++this.attributeIdIncrementor;
  }

  /**
   * The default attribute builder model when this component is created.
   * It should be a attribute group with one child blank attribute row.
   */
  private getInitialModel(): AttributeGroupModel {
    return {
      children: [
        {
          attribute: this.props.controlledAttributes[0],
          id: this.getNewAttributeId(),
          type: "ATTRIBUTE_ROW",
          value: ""
        }
      ],
      id: this.getNewAttributeId(),
      type: "ATTRIBUTE_GROUP"
    };
  }

  /**
   * Adds a new AttributeRow to the model.
   */
  private addAttributeRow({
    after,
    parent
  }: {
    /** The attribute to add a new one before, e.g. the attribute with the clicked button. */
    after: AttributeRowModel | AttributeGroupModel;
    /** The new attribute's parent group. */
    parent: AttributeGroupModel;
  }) {
    const newAttributeRow: AttributeRowModel = {
      attribute: this.props.controlledAttributes[0],
      id: this.getNewAttributeId(),
      type: "ATTRIBUTE_ROW",
      value: ""
    };

    parent.children.splice(parent.children.indexOf(after), 0, newAttributeRow);

    // Re-render the component.
    this.forceUpdate();
    this.onChange();
  }

  /**
   * Removes a attribute row.
   */
  private removeAttribute({
    attribute,
    parent
  }: {
    attribute: AttributeRowModel | AttributeGroupModel;
    parent: AttributeGroupModel;
  }) {
    // Remove the attribute row from the parent's children array.
    parent.children = pull(parent.children, attribute);

    // Re-render the component.
    this.forceUpdate();
    this.onChange();
  }

  /**
   * Renders either a AttributeRow or AttributeGroup depending on the given model.
   */
  private renderAttribute({
    model,
    parent
  }: {
    model: AttributeGroupModel | AttributeRowModel;
    parent: AttributeGroupModel;
  }): JSX.Element {
    const onAndClick = () => {
      this.addAttributeRow({
        after: model,
        parent
      });
    };

    const onRemoveClick = () => {
      this.removeAttribute({
        attribute: model,
        parent
      });
    };

    switch (model.type) {
      case "ATTRIBUTE_GROUP": {
        const children = model.children.map(child =>
          this.renderAttribute({ model: child, parent: model })
        );

        return (
          <AttributeGroup key={model.id} model={model}>
            {children}
          </AttributeGroup>
        );
      }
      case "ATTRIBUTE_ROW": {
        // Don't show the remove button when this is the only AttributeRow.
        const showRemoveButton = !isEqual(this.state.model.children, [model]);

        return (
          <AttributeRow
            key={model.id}
            model={model}
            onAndClick={onAndClick}
            onChange={this.onChange}
            onRemoveClick={onRemoveClick}
            controlledAttributes={this.props.controlledAttributes}
            showRemoveButton={showRemoveButton}
          />
        );
      }
    }
  }

  private onChange = () => {
    // this.props.controlledAttributes =
    const { onChange = () => undefined } = this.props;
    onChange(this.state.model);
  };
}
