import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import _ from "lodash";
import { SelectOption } from "packages/common-ui/lib/formik-connected/SelectField";
import Select from "react-select";

interface QueryRowImageLinkProps {
  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;
}

// Supported derivative types for the image link selection.
// Each of these options should have a translation provided: queryBuilder_imageLink_[TYPE]
export const SUPPORTED_DERIVATIVE_TYPES: string[] = [
  "ORIGINAL",
  "THUMBNAIL",
  "LARGE_IMAGE"
];

export interface ImageLinkStates {
  selectedImageType: string;
}

/**
 * This component is mainly used in the Column Selector to generate a image link to be displayed.
 *
 * The user needs to select an image type that will be displayed when clicked.
 */
export default function QueryRowImageLink({
  value,
  setValue
}: QueryRowImageLinkProps) {
  const { formatMessage } = useIntl();

  const [imageLinkState, setImageLinkState] = useState<ImageLinkStates>(() =>
    value
      ? JSON.parse(value)
      : {
          selectedImageType: "ORIGINAL"
        }
  );

  // Convert the state in this component to a value that can be stored in the Query Builder.
  useEffect(() => {
    if (setValue) {
      setValue(JSON.stringify(imageLinkState));
    }
  }, [imageLinkState, setValue]);

  // Convert a value from Query Builder into the Image Link State in this component.
  useEffect(() => {
    if (value) {
      setImageLinkState(JSON.parse(value));
    }
  }, []);

  // Generate the image type options
  const imageTypeOptions = SUPPORTED_DERIVATIVE_TYPES.map<SelectOption<string>>(
    (option) => ({
      label: formatMessage({ id: "queryBuilder_imageLink_" + option }),
      value: option
    })
  );

  // Currently selected option, if no option can be found just select the first one.
  const selectedImageType = imageTypeOptions?.find(
    (operator) => operator.value === imageLinkState.selectedImageType
  );

  return (
    <>
      <Select<SelectOption<string>>
        options={imageTypeOptions}
        className={`col me-1 ps-0`}
        value={selectedImageType}
        onChange={(selected) =>
          setImageLinkState({
            ...imageLinkState,
            selectedImageType: selected?.value ?? ""
          })
        }
        captureMenuScroll={true}
        menuPlacement={"auto"}
        menuShouldScrollIntoView={false}
        minMenuHeight={600}
      />
    </>
  );
}
