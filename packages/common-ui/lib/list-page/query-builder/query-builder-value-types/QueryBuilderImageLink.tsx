import React, { useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import _ from "lodash";
import { SelectOption } from "packages/common-ui/lib/formik-connected/SelectField";
import Select from "react-select";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { TableColumn } from "../../types";
import { KitsuResource } from "kitsu";
import { useDinaIntl } from "../../../../../dina-ui/intl/dina-ui-intl";

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
  "THUMBNAIL_IMAGE",
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
      {/* Image Type Selector */}
      <label className={"ps-0 mt-2"}>
        <strong>{formatMessage({ id: "selectImageTypeToUse" })}</strong>
      </label>
      <Select<SelectOption<string>>
        options={imageTypeOptions}
        className={`col ps-0 mt-2`}
        value={selectedImageType}
        onChange={(selected) =>
          setImageLinkState({
            ...imageLinkState,
            selectedImageType: selected?.value ?? ""
          })
        }
        captureMenuScroll={true}
        menuPlacement={"bottom"}
        menuShouldScrollIntoView={false}
        minMenuHeight={600}
      />
    </>
  );
}

/**
 * This column is mainly used for the metadata query page.
 *
 * This is used to display metadata image links. The user can decide what kind of image type
 * should be used.
 *
 * For derivatives, it will display a link of the first found derivative matching the type.
 *
 * @param path Column path.
 * @param imageType Image type to display the image for, for example: "LARGE_IMAGE"
 * @returns Column to be displayed to the user.
 */
export function getImageLinkColumn<TData extends KitsuResource>(
  path: string,
  imageType: string
): TableColumn<TData> {
  return {
    accessorKey: `data.attributes.fileIdentifier`,
    id: `imageLink.${imageType}`,
    header: () => <ImageLinkLabel imageType={imageType} />,
    cell: ({ row: { original } }) => {
      return <ImageLinkButton imageType={imageType} metadata={original} />;
    },
    isKeyword: true,
    isColumnVisible: true,
    enableSorting: false,
    columnSelectorString: path,
    size: 350
  };
}

/**
 * Component used for generating the image link label with locale support.
 * @param imageType Image type to be used to generate the label (e.g. LARGE_IMAGE)
 * @returns String with the label
 */
export interface ImageLinkLabelProps {
  imageType: string;
}

export function ImageLinkLabel({ imageType }: ImageLinkLabelProps) {
  const { formatMessage, messages } = useDinaIntl();

  const imageLinkLabel = messages["queryBuilder_imageLink_" + imageType]
    ? formatMessage(("queryBuilder_imageLink_" + imageType) as any)
    : _.startCase(imageType);

  return <>{imageLinkLabel}</>;
}

export const IMAGE_VIEW_LINK = "/object-store/object/image-view?id=";

export interface ImageLinkButtonProps {
  imageType: string;
  metadata: any;
}

export function ImageLinkButton({ imageType, metadata }: ImageLinkButtonProps) {
  const fileIdentifier = useMemo<string | undefined>(() => {
    // If original, that can be retrieved from the metadata.
    if (
      imageType === "ORIGINAL" &&
      metadata?.data?.attributes?.fileIdentifier
    ) {
      return metadata.data.attributes.fileIdentifier;
    }

    // Check if any derivatives exist...
    if (
      metadata?.included?.derivatives &&
      metadata.included.derivatives.length > 0
    ) {
      const foundDerivative = metadata.included.derivatives.find(
        (derivative) => {
          return (
            derivative?.attributes?.derivativeType === imageType &&
            derivative?.attributes?.fileIdentifier
          );
        }
      );

      if (foundDerivative) {
        return foundDerivative.attributes.fileIdentifier;
      }
    }

    // No image found to link to.
    return undefined;
  }, [imageType, metadata]);

  // Do not display anything in the column if no file identifier can be found for the image type.
  if (fileIdentifier === undefined) {
    return <></>;
  }

  return (
    <div className="text-center">
      <a
        href={IMAGE_VIEW_LINK + fileIdentifier}
        target="_blank"
        rel="noopener noreferrer"
      >
        View Image <FaArrowUpRightFromSquare />
      </a>
    </div>
  );
}
