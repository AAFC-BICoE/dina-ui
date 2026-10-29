import Link from "next/link";
import { MaterialSample } from "../../../types/collection-api";
import { NotPubliclyReleasableWarning } from "../../tag-editor/NotPubliclyReleasableWarning";
import { GroupSelectField } from "../../group-select/GroupSelectField";
import { useDinaFormContext } from "../../../../common-ui/lib/formik-connected/DinaForm";
import { DinaFormSection } from "common-ui";
import { GroupLabel } from "../../group-select/GroupFieldView";
import { BreadcrumbBanner } from "../../breadcrumb/BreadcrumbBanner";

export interface MaterialSampleBreadCrumbProps {
  disableLastLink?: boolean;
  materialSample: MaterialSample;
  /**
   * Sets a default group from local storage if no initial value is set (e.g. from existing value in a group field).
   * This should be used in forms to add new data, not in search forms like list pages.
   */
  enableStoredDefaultGroup?: boolean;

  enableGroupSelectField?: boolean;
}

export function MaterialSampleBreadCrumb({
  disableLastLink,
  materialSample,
  enableStoredDefaultGroup,
  enableGroupSelectField
}: MaterialSampleBreadCrumbProps) {
  const { readOnly } = useDinaFormContext();
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
  const customStyle = {
    option: (base) => {
      return {
        ...base,
        ...{ fontWeight: "normal" }
      };
    },
    control: (base) => {
      return {
        ...base,
        ...{ fontWeight: "normal" }
      };
    }
  };
  return (
    <>
      {/* Current Material Sample Name */}
      <div className="d-flex flex-wrap align-items-end column-gap-3 row-gap-2">
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
        {enableGroupSelectField &&
          (!readOnly ? (
            <div className="col-md-6 align-self-end mb-0">
              <DinaFormSection horizontal={"flex"}>
                <GroupSelectField
                  disableTemplateCheckbox={true}
                  name="group"
                  enableStoredDefaultGroup={enableStoredDefaultGroup}
                  readOnlyHideLabel={true}
                  removeBottomMargin={true}
                  styles={customStyle}
                />
              </DinaFormSection>
            </div>
          ) : (
            <div className="d-inline-flex flex-row align-self-end">
              <div className="header-group-text">
                <GroupLabel groupName={materialSample?.group} />
              </div>
              <NotPubliclyReleasableWarning />
            </div>
          ))}
        {scientificName && (
          <div
            className="fst-italic fw-medium mt-1 ms-auto"
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
