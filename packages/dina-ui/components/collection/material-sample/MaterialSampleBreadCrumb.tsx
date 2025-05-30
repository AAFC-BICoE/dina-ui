import Link from "next/link";
import { MaterialSample } from "../../../types/collection-api";
import { NotPubliclyReleasableWarning } from "../../tag-editor/NotPubliclyReleasableWarning";
import { GroupSelectField } from "../../group-select/GroupSelectField";
import { useDinaFormContext } from "../../../../common-ui/lib/formik-connected/DinaForm";
import { DinaFormSection } from "common-ui";
import { GroupLabel } from "../../group-select/GroupFieldView";

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
      <h1 id="wb-cont" className="d-flex justify-content-between">
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
        {enableGroupSelectField &&
          (!readOnly ? (
            <h6 className="col-md-6 align-self-end mb-0">
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
            </h6>
          ) : (
            <div className="d-inline-flex flex-row align-self-end">
              <div className="header-group-text">
                <GroupLabel groupName={materialSample?.group} />
              </div>
              <NotPubliclyReleasableWarning />
            </div>
          ))}
      </h1>
      {/* Material Sample Parents */}
      {parentPath.length !== 0 && (
        <div className="card well px-3 py-2 mb-3">
          <ol className="breadcrumb breadcrumb-slash mb-1">
            {parentPath.map((node) => (
              <li className="breadcrumb-item" key={node.uuid}>
                <Link href={`/collection/material-sample/view?id=${node.uuid}`}>
                  {node.name}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
