/*
 * Form Legends are used to describe the contents of the form. Form legends are the source of
 * truth used for Form templates in order to determine the structure it's saved as.
 */

/**
 * Top Level components in the form structure.
 *
 * Components contain sections inside of it.
 */
export interface FormLegendComponentInformation {
  /** ID/Name of the section. Also used as the scroll target for each section. */
  id: string;

  /** Translated label key of the section. */
  labelKey: string;

  /** ClassName for the switch. */
  switchClassName?: string;

  maxGridSizeX: number;

  sections: FormLegendSectionInformation[];

  formTemplateOnly?: boolean;
}

/**
 * Section level in the form structure.
 *
 * Sections contain fields, sections are inside of components.
 */
export interface FormLegendSectionInformation {
  id: string;

  labelKey?: string;

  maxGridSizeX: number;

  items: FormLegendFieldInformation[];
}

/**
 * Field level of the form structure.
 *
 * Fields are inside of sections.
 */
export interface FormLegendFieldInformation {
  id: string;
  visible?: boolean;
}
