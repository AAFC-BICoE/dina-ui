import Link from "next/link";
import { MaterialSample } from "../../../types/collection-api";
import { NotPubliclyReleasableWarning } from "../../tag-editor/NotPubliclyReleasableWarning";

export interface MaterialSampleBreadCrumbProps {
  disableLastLink?: boolean;
  materialSample: MaterialSample;
}

export function MaterialSampleBreadCrumb({
  disableLastLink,
  materialSample
}: MaterialSampleBreadCrumbProps) {
  const parentPath = [...(materialSample.hierarchy?.slice(1) ?? [])];

  const displayName = materialSample.materialSampleName;

  return (
    <>
      {/* Current Material Sample Name */}
      <h1 id="wb-cont">
        <strong>
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
