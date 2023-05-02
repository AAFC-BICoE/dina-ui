import Link from "next/link";
import { MaterialSample } from "../../../types/collection-api";
import { NotPubliclyReleasableWarning } from "../../tag-editor/NotPubliclyReleasableWarning";
import { GroupSelectField } from "../../group-select/GroupSelectField";
import { useDinaFormContext } from "../../../../common-ui/lib/formik-connected/DinaForm";

export interface MaterialSampleBreadCrumbProps {
  disableLastLink?: boolean;
  materialSample: MaterialSample;
  /**
   * Sets a default group from local storage if no initial value is set (e.g. from existing value in a group field).
   * This should be used in forms to add new data, not in search forms like list pages.
   */
  enableStoredDefaultGroup?: boolean;
}

export function MaterialSampleBreadCrumb({
  disableLastLink,
  materialSample,
  enableStoredDefaultGroup
}: MaterialSampleBreadCrumbProps) {
  const parentPath = [...(materialSample.hierarchy?.slice(1) ?? [])];

  const displayName = materialSample.materialSampleName;
  const { readOnly } = useDinaFormContext();
  return (
    <>
      {/* Current Material Sample Name */}
      <h1 id="wb-cont" className="d-flex justify-content-between">
        <strong className={readOnly ? undefined : "align-self-end mb-3"}>
          {!disableLastLink ? (
            <Link
              href={`/collection/material-sample/view?id=${materialSample.id}`}
            >
              <a>{displayName}</a>
            </Link>
          ) : (
            <div className="d-inline-flex flex-row align-items-center">
              <span>{displayName}</span>
              <NotPubliclyReleasableWarning />
            </div>
          )}
        </strong>
        <h6 className="col-md-2">
          <GroupSelectField
            disableTemplateCheckbox={true}
            name="group"
            enableStoredDefaultGroup={enableStoredDefaultGroup}
            readOnlyHideLabel={true}
            removeBottomMargin={true}
          />
        </h6>
      </h1>

      {/* Material Sample Parents */}
      <div className="ms-4">
        <ol
          className="breadcrumb mb-2"
          style={{ "--bs-breadcrumb-divider": "'/'" } as any}
        >
          {parentPath.map((node) => (
            <li className="breadcrumb-item" key={node.uuid}>
              <Link href={`/collection/material-sample/view?id=${node.uuid}`}>
                <a>{node.name}</a>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
