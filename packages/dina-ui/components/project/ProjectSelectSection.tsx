import {
  DinaFormSection,
  filterBy,
  ResourceSelectField,
  useDinaFormContext
} from "common-ui";
import { IoIosListBox } from "react-icons/io";
import { Project } from "../../../dina-ui/types/collection-api/resources/Project";
import { DinaMessage } from "../../intl/dina-ui-intl";

export interface ProjectSelectSectionProps {
  resourcePath?: string;
  classNames?: string;
}

export function ProjectSelectSection({
  resourcePath,
  classNames
}: ProjectSelectSectionProps) {
  const { readOnly } = useDinaFormContext();
  return readOnly ? (
    <ProjectSelectField resourcePath={resourcePath} />
  ) : (
    <div className={`${classNames} row`}>
      <DinaFormSection horizontal="flex">
        <div className="col-md-6">
          <div className="d-flex flex-row gap-1">
            <ProjectSelectField
              resourcePath={resourcePath}
              className="flex-grow-1 mb-2"
            />
          </div>
        </div>
      </DinaFormSection>
    </div>
  );
}

export interface ProjectSelectFieldProps {
  resourcePath?: string;
  className?: string;
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
        className={"projects " + (className || "")}
        optionLabel={prj => prj.name}
        hideLabel={readOnly}
        removeLabel={readOnly}
        label={
          <span>
            <IoIosListBox /> <DinaMessage id="projects" />
          </span>
        }
        readOnlyRender={(value, _) =>
          Array.isArray(value) ? (
            <div className="d-flex flex-row gap-2">
              {value.map((val, idx) => (
                <div
                  className="card py-1 px-2 d-flex flex-row align-items-center gap-1 label-default label-outlined"
                  key={idx}
                >
                  <IoIosListBox />
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
