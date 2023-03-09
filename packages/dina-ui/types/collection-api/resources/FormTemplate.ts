import { KitsuResource } from "kitsu";
import { SplitConfiguration } from "./SplitConfiguration";

export interface FormTemplateComponents {
  // Visibility for each of the items.
  templateCheckboxes: { [key: string]: boolean };

  // Default values are stored directly in the form as well.
  [key: string]: any;
}

export interface FormTemplate extends KitsuResource {
  type: "form-template";
  createdOn?: string;
  createdBy?: string;
  name?: string;
  group?: string;
  restrictToCreatedBy?: boolean;

  /** This field is JSON with unknown structure, so use Yup or Zod for schema validation / casting. */
  viewConfiguration?: unknown;

  components?: FormTemplateComponent[];

  // Not saved to the API, only used in the UI.
  splitConfiguration?: SplitConfiguration;
}

/**
 * The FormTemplateComponent resource represents a data component of a FormTemplate.
 *
 * This is considered the high level section of the form. It can only be ordered in the Y axis.
 *
 * For example, the "Associations" data component of the Material Sample edit page is a
 * FormTemplateComponent.
 */
export interface FormTemplateComponent {
  /** Name of the component. */
  name?: string;

  /** Data component order. Lowest being at the top, highest at the bottom of the list. */
  order?: number;

  /** Data component visibility. */
  visible?: boolean;

  /** Data component maximum X position allowed. */
  gridSizeX?: number;

  sections?: FormTemplateSection[];
}

/**
 * The FormTemplateSection resource represents a section of a FormTemplate.
 *
 * A data component can have multiple sections. Sections can be ordered in the X and Y axis.
 * Sections are usually considered the sub categories of the data component.
 *
 * For example, in the "Associations" data component of the Material Sample edit page, the
 * "Host Organism" section is a FormTemplateSection.
 */
export interface FormTemplateSection {
  /** Name of the section. */
  name?: string;

  /** Section visibility. */
  visible?: boolean;

  /** The X position to display the section. */
  gridPositionX?: number;

  /** The Y position to display the section. */
  gridPositionY?: number;

  items?: FormTemplateSectionItem[];
}

/**
 * An item is considered a field in a Form Template.
 *
 * Fields can be ordered in the X and Y axis within the section they are in. Items can have a
 * default value set they represent a unit of data.
 *
 * For example, In the "Associations" data component, the "Host Organism" section, the "Host" field
 * is a FormTemplateSectionItem.
 */
export interface FormTemplateSectionItem {
  /** Name of the item. */
  name?: string;

  /** Section visibility. */
  visible?: boolean;

  /** The X position to display the section. */
  gridPositionX?: number;

  /** The Y position to display the section. */
  gridPositionY?: number;

  /** Default value for the section. Can be any type. */
  defaultValue?: any;
}
