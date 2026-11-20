import Link from "next/link";
import { MaterialSample } from "../../../types/collection-api";
import { BreadcrumbBanner } from "../../breadcrumb/BreadcrumbBanner";

export interface MaterialSampleBreadCrumbProps {
  disableLastLink?: boolean;
  materialSample: MaterialSample;
}

export function MaterialSampleBreadCrumb({
  disableLastLink,
  materialSample
}: MaterialSampleBreadCrumbProps) {
  const parentPath = [...(materialSample.hierarchy?.slice(1) ?? [])];

  const displayName = materialSample.materialSampleName ?? materialSample.id;
  const organismCount = materialSample.organism?.filter(Boolean).length ?? 0;
  const singleOrganism =
    organismCount === 1 ? materialSample.organism?.find(Boolean) : undefined;

  const primaryDetermination = singleOrganism?.determination?.find(
    (determination) => determination?.isPrimary
  );

  const scientificName = primaryDetermination?.scientificName;
  const determinationCount =
    materialSample.organism?.reduce(
      (total, organism) => total + (organism?.determination?.length ?? 0),
      0
    ) ?? 0;

  const collectionName = materialSample.collection?.name;
  return (
    <>
      {/* Current Material Sample Name */}
      <div className="d-flex justify-content-between align-items-start column-gap-3">
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <h2
            id="wb-cont"
            className="mb-0"
            style={{
              fontSize: "1.4rem"
            }}
          >
            <strong>
              {!disableLastLink ? (
                <Link
                  href={`/collection/material-sample/view?id=${materialSample.id}`}
                >
                  {displayName}
                </Link>
              ) : (
                <div className="d-inline-flex flex-row align-items-center">
                  <span>{displayName}</span>
                </div>
              )}
            </strong>
          </h2>
          <div className="d-flex align-items-center gap-3 text-muted mt-1 mb-0">
            {collectionName && (
              <span
                className="text-uppercase fw-semibold"
                style={{ letterSpacing: "0.08em" }}
              >
                {collectionName}
              </span>
            )}

            {collectionName && <span className="text-secondary">|</span>}

            <span className="fst-italic">
              {organismCount} {organismCount === 1 ? "organism" : "organisms"}
            </span>

            <span className="text-secondary">|</span>

            <span className="fst-italic">
              {determinationCount}{" "}
              {determinationCount === 1 ? "determination" : "determinations"}
            </span>
          </div>
        </div>
        <div className="col-md-6 d-flex flex-column align-items-end mt-4">
          {scientificName && (
            <div
              className="fw-medium text-end"
              style={{
                fontSize: "1.1rem",
                lineHeight: 1.4,
                overflowWrap: "anywhere",
                whiteSpace: "normal",
                minWidth: 0,
                maxWidth: "100%"
              }}
            >
              {scientificName}
            </div>
          )}
        </div>
      </div>
      {/* Material Sample Parents */}
      {parentPath.length !== 0 && (
        <BreadcrumbBanner
          items={parentPath.map((parent) => ({
            href: `/collection/material-sample/view?id=${parent.uuid}`,
            label: parent.name
          }))}
        />
      )}
    </>
  );
}
