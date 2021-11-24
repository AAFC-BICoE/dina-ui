import { filterBy, ResourceSelectField, useDinaFormContext, DinaFormSection } from "../../../common-ui/lib"
import { Project } from "../../../dina-ui/types/collection-api/resources/Project";
import { FaFolderOpen } from "react-icons/fa";

export interface ProjectSelectSectionProps {
  resourcePath?: string;
} 

export function ProjectSelectSection({
  resourcePath
}: ProjectSelectFieldProps) {
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
  resourcePath?: string,
  className?: string
}

export function ProjectSelectField({
  resourcePath,
  className
}: ProjectSelectFieldProps) {
  const { readOnly } = useDinaFormContext();
  return (
    <DinaFormSection horizontal={"flex"} readOnly={readOnly}>
      <ResourceSelectField<Project>
        name="projects"
        isMulti={true}
        readOnlyLink="/collection/project/view?id="
        filter={filterBy(["name"])}
        model={resourcePath as any}
        className={className}
        optionLabel={prj => prj.name}
        hideLabel={readOnly}
        removeLabel={readOnly}
        readOnlyRender={(value, _) =>
          Array.isArray(value) ? (
            <div className="d-flex flex-row gap-2">
              {value.map((val, idx) => (
                <div
                  className="card p-1 d-flex flex-row align-items-center gap-1 label-default label-outlined"
                  key={idx}
                >
                  <FaFolderOpen />
                  <span>{val.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <></>
          )
        }
      />
    </DinaFormSection>
  );
}