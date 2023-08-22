import { KitsuResource } from "kitsu";
import { get } from "lodash";

export function useMetadataThumbnailPath<TData extends KitsuResource>(
  original: TData,
  bucketField: string,
  isJsonApiQuery: boolean | undefined
) {
  const bucket = get(original as any, bucketField);
  let derivatives: any[] | undefined = (original as any)?.included?.derivative;
  let thumbnailDerivative = derivatives?.find(
    (derivative) => derivative.attributes.derivativeType === "THUMBNAIL_IMAGE"
  );
  let filePath = thumbnailDerivative
    ? `/objectstore-api/file/${bucket}/derivative/${thumbnailDerivative.attributes.fileIdentifier}`
    : "";
  let resourceExternalURL = (original as any)?.data?.attributes
    ?.resourceExternalURL;
  let hasExternalResourceDerivative =
    resourceExternalURL && (original as any)?.included?.derivative;
  if (isJsonApiQuery) {
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
      resourceExternalURL && (original as any)?.included?.derivative;
  }
  return { resourceExternalURL, hasExternalResourceDerivative, filePath };
}
