import { filterBy, ResourceSelectField, useDinaFormContext } from "../../../common-ui/lib"
import { Project } from "../../../dina-ui/types/collection-api/resources/Project";
import { FaFolderOpen } from "react-icons/fa";

export default function ProjectSelectSection ({resourcePath}) {
  const { readOnly } = useDinaFormContext();
  return readOnly ? (
    <ProjectSelectField resourcePath={resourcePath}/>
  ) : (
    <div className="card p-1 flex-row align-items-center gap-1">
      <FaFolderOpen />
      <ProjectSelectField resourcePath={resourcePath}/>
    </div>
  );
}

export function ProjectSelectField ({resourcePath}) {
  return (
    <ResourceSelectField<Project>
      name="project"
      readOnlyLink="/collection/project/view?id="
      filter={filterBy(["name"])}
      model={resourcePath}
      optionLabel={prj => prj.name}
      readOnlyRender={(value, _) => (
        <div
          className="card p-1 flex-row align-items-center gap-1"          
        >
          <FaFolderOpen />
          <span>{value}</span>
        </div>
      )}
    />
  );
}