import Link from "next/link";
import { useRef } from "react";
import { FaBug, FaLock } from "react-icons/fa";
import { FaTurnUp } from "react-icons/fa6";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";
import { GroupLabel } from "../../group-select/GroupFieldView";
import { MaterialSampleCompactHeader } from "./MaterialSampleCompactHeader";

export interface MaterialSampleViewHeaderProps {
  materialSample: MaterialSample;
}

/** Title block of the material sample view page: parent, name, determination, group, collection and release status. */
export function MaterialSampleViewHeader({
  materialSample
}: MaterialSampleViewHeaderProps) {
  // hierarchy[0] is this sample, hierarchy[1] is its direct parent.
  const parent = materialSample.parentMaterialSample
    ? materialSample.hierarchy?.[1]
    : undefined;
  const collection = materialSample.collection;

  const organisms = materialSample.organism?.filter(Boolean) ?? [];
  const scientificName =
    organisms.length === 1
      ? organisms[0]?.determination?.find((det) => det?.isPrimary)
          ?.scientificName
      : undefined;
  const determinationCount = organisms.reduce(
    (total, organism) => total + (organism?.determination?.length ?? 0),
    0
  );

  const headerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <MaterialSampleCompactHeader
        materialSample={materialSample}
        scientificName={scientificName}
        headerRef={headerRef}
      />
      <div
        ref={headerRef}
        className={`d-flex flex-wrap flex-md-nowrap justify-content-between gap-3 pb-3 mb-3 border-bottom ${
          parent ? "mt-3" : ""
        } ${materialSample.isRestricted ? "border-danger" : ""}`}
      >
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          {parent && (
            <div className="text-muted">
              <FaTurnUp className="me-1" style={{ transform: "scaleX(-1)" }} />
              <span style={{ position: "relative", top: "2px" }}>
                <DinaMessage id="parent" />{" "}
                <Link
                  href={`/collection/material-sample/view?id=${parent.uuid}`}
                >
                  {parent.name}
                </Link>
              </span>
            </div>
          )}
          <h2 id="wb-cont" className="fw-bold mb-2">
            {materialSample.materialSampleName ?? materialSample.id}
          </h2>
          {scientificName && (
            <div className="fs-5 mb-1" style={{ overflowWrap: "anywhere" }}>
              {scientificName}
            </div>
          )}
          <div className="text-muted">
            <FaBug className="me-2" />
            {organisms.length}{" "}
            {organisms.length === 1 ? "organism" : "organisms"} ·{" "}
            {determinationCount}{" "}
            {determinationCount === 1 ? "determination" : "determinations"}
          </div>
        </div>
        <div
          className="border-start ps-3 mt-3 d-flex flex-column gap-2 flex-shrink-0"
          style={{ maxWidth: "25rem", overflowWrap: "anywhere" }}
        >
          <div>
            <div className="text-muted small">
              <DinaMessage id="group" />
            </div>
            <GroupLabel
              groupName={materialSample.group}
              defaultLinkColor={true}
            />
          </div>
          {collection?.id && (
            <div>
              <div className="text-muted small">
                <DinaMessage id="collection" />
              </div>
              <Link href={`/collection/collection/view?id=${collection.id}`}>
                {collection.name || collection.id}
                {collection.code ? ` (${collection.code})` : ""}
              </Link>
            </div>
          )}
          {!materialSample.publiclyReleasable && (
            <div className="not-publicly-releasable">
              <div className="fw-bold">
                <FaLock className="me-1" />
                <DinaMessage id="notPubliclyReleasable" />
              </div>
              {materialSample.notPubliclyReleasableReason}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
