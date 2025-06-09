import { KitsuResource } from "kitsu";
import _ from "lodash";

export function useMetadataThumbnailPath<TData extends KitsuResource>(
  original: TData,
  bucketField: string,
  isJsonApiQuery: boolean | undefined
) {
  const bucket = _.get(original as any, bucketField);
  let acCaption = _.get(original as any, "data.attributes.acCaption");
  let originalFileName = _.get(
    original as any,
    "data.attributes.originalFileName"
  );
  let derivatives: any[] | any | undefined = (original as any)?.included
    ?.derivatives;
  let thumbnailDerivative;
  if (Array.isArray(derivatives)) {
    thumbnailDerivative = derivatives?.find(
      (derivative) => derivative.attributes.derivativeType === "THUMBNAIL_IMAGE"
    );
  } else {
    if (derivatives?.attributes?.derivativeType === "THUMBNAIL_IMAGE") {
      thumbnailDerivative = derivatives;
    }
  }

  let filePath = thumbnailDerivative
    ? `/objectstore-api/file/${bucket}/derivative/${thumbnailDerivative.attributes.fileIdentifier}`
    : "";
  let resourceExternalURL = (original as any)?.data?.attributes
    ?.resourceExternalURL;
  let hasExternalResourceDerivative =
    resourceExternalURL && (original as any)?.included?.derivatives;
  if (isJsonApiQuery) {
    acCaption = _.get(original as any, "metadata.acCaption");
    originalFileName = _.get(original as any, "metadata.originalFileName");
    derivatives = (original as any)?.metadata
      ? (original as any)?.metadata.derivatives
      : (original as any)?.derivatives;
    thumbnailDerivative = derivatives?.find(
      (derivative) => derivative.derivativeType === "THUMBNAIL_IMAGE"
    );
    filePath = thumbnailDerivative
      ? `/objectstore-api/file/${bucket}/derivative/${thumbnailDerivative.fileIdentifier}`
      : "";
    resourceExternalURL = (original as any)?.data?.attributes
      ?.resourceExternalURL;
    hasExternalResourceDerivative =
      resourceExternalURL && (original as any)?.included?.derivatives;
  }
  const altImage = acCaption ? acCaption : originalFileName;
  return {
    resourceExternalURL,
    hasExternalResourceDerivative,
    filePath,
    altImage
  };
}
