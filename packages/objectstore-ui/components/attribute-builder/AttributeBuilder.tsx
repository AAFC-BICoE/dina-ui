import { isEqual, pull } from "lodash";
import React from "react";
import { ManagedAttribute } from "types/objectstore-api/resources/ManagedAttribute";
import { MetaManagedAttribute } from "types/objectstore-api/resources/MetaManagedAttribute";
import { AttributeGroup, AttributeGroupModel } from "./AttributeGroup";
import { AttributeRow, AttributeRowModel } from "./AttributeRow";

export interface ControlledAttribute {
  name?: string;
  value: string;
  ma_data?: ManagedAttribute;
  metama_data?: MetaManagedAttribute;
}

export interface AttributeBuilderProps {
  controlledAttributes: ControlledAttribute[];
  value?: AttributeGroupModel;
  onChange?: (state: AttributeGroupModel) => void;
  initValues?: any;
}

export interface AttributeBuilderState {
  model: AttributeGroupModel;
  controlledAttributes: ControlledAttribute[];
  initValues?: any;
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

  private btnClicked = false;

  constructor(props: AttributeBuilderProps) {
    super(props);
    this.state = {
      controlledAttributes: props.controlledAttributes,
      initValues: props.initValues,
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
    const parent = this.state.model;
    let before = this.state.model;
    const model = before;
    if (
      this.props.controlledAttributes.length > 1 &&
      this.btnClicked === false
    ) {
      this.props.controlledAttributes.map(ca => {
        if (!ca.name?.includes("managed") && !ca.name?.includes("unManaged")) {
          before = parent.children[parent.children.length - 1] as any;
          this.addAttributeRowNoUpdate({ before, parent, ca });
        }
      });
    }
    this.btnClicked = false;
    return this.renderAttribute({ model, parent });
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
          value: "Plus"
        }
      ],
      id: this.getNewAttributeId(),
      type: "ATTRIBUTE_GROUP"
    };
  }

  // Add the new row in front of the old one with the id assigned by the controlled attributes
  // also update the gloabl row counter with id+1 in prepartion for the new row model id to
  // be added by clicking the plus sign
  private addAttributeRowNoUpdate({
    before,
    parent,
    ca
  }: {
    /** The attribute to add a new one before */
    before: AttributeRowModel | AttributeGroupModel;
    /** The new attribute's parent group. */
    parent: AttributeGroupModel;
    ca: ControlledAttribute;
  }) {
    const id = parseInt(ca.value, 10);
    this.attributeIdIncrementor = id + 1;
    const newAttributeRow: AttributeRowModel = {
      attribute: ca,
      id,
      type: "ATTRIBUTE_ROW",
      value: ""
    };

    if (before.type === "ATTRIBUTE_ROW") {
      before.attribute = undefined;
    }
    parent.children.unshift(newAttributeRow);
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
      attribute: undefined,
      id: this.getNewAttributeId(),
      type: "ATTRIBUTE_ROW",
      value: "Plus"
    };

    if (after.type === "ATTRIBUTE_ROW") {
      after.value = "";
    }
    parent.children.splice(
      parent.children.indexOf(after) + 1,
      0,
      newAttributeRow
    );

    // Re-render the component.
    this.btnClicked = true;
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
    if (attribute.type === "ATTRIBUTE_ROW" && attribute.attribute) {
      if (this.state.initValues) {
        delete this.state.initValues["key_" + attribute.id];
        delete this.state.initValues["assignedValue" + attribute.id];
        delete this.state.initValues["assignedValue_un" + attribute.id];
      }
    }
    parent.children = pull(parent.children, attribute);

    this.btnClicked = true;
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
        // Show the add button when this is the only AttributeRow or it is the very bottom row for editing
        const showPlusButton =
          isEqual(model.value, "Plus") ||
          isEqual(this.state.model.children, [model]);
        // Don't show the remove button when this is the only AttributeRow
        // show the remove button when there is a new row added due to user editing new attribute
        const showRemoveButton =
          !isEqual(this.state.model.children, [model]) && !showPlusButton;

        return (
          <AttributeRow
            key={model.id}
            model={model}
            onAndClick={onAndClick}
            onChange={this.onChange}
            onRemoveClick={onRemoveClick}
            controlledAttributes={this.props.controlledAttributes}
            showRemoveButton={showRemoveButton}
            showPlusButton={showPlusButton}
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
