export interface LabelWrapperParams {
  /** The CSS classes of the div wrapper. */
  className?: string;

  /** The name of the field. */
  name: string;

  /** The label for the field. */
  label?: string;

  /** Tootip Msg provided for the field, move to here to cover text field with tooltip case */
  tooltipMsg?: string;

  readOnly?: boolean;

  initialValue?: string;
}
