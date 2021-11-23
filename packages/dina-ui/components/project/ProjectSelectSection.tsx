import { filterBy, ResourceSelectField, useDinaFormContext, DinaFormSection } from "../../../common-ui/lib"
import { Project } from "../../../dina-ui/types/collection-api/resources/Project";
import { FaFolderOpen } from "react-icons/fa";

export default function ProjectSelectSection ({resourcePath}) {
  const { readOnly } = useDinaFormContext();
  return readOnly ? (
    <ProjectSelectField resourcePath={resourcePath} />
  ) : (
    <div className="row">
      <div className="col-md-6">
        <div className="d-flex flex-row gap-1 align-items-center">
          <FaFolderOpen className="mb-3" />
          <ProjectSelectField
            resourcePath={resourcePath}
            className="flex-grow-1"
          />
        </div>
      </div>
    </div>
  );
}

export interface ProjectSelectFieldProps {
  resourcePath: string,
  className?: string
}

export function ProjectSelectField({
  resourcePath,
  className
}: ProjectSelectFieldProps) {
  return (
    <DinaFormSection horizontal={"flex"}>
      <ResourceSelectField<Project>
        name="project"
        readOnlyLink="/collection/project/view?id="
        filter={filterBy(["name"])}
        model={resourcePath}
        className={className}
        optionLabel={prj => prj.name}
        readOnlyRender={(value, _) => (
          <div className="card p-1 flex-row gap-1">
            <FaFolderOpen className="mt-2" />
            <span>{value}</span>
          </div>
        )}
      />
    </DinaFormSection>
  );
}