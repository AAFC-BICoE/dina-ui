import {
  DinaFormSection,
  DinaFormSectionProps,
  ResourceSelectField,
  SimpleSearchFilterBuilder,
  Tooltip,
  useDinaFormContext
} from "common-ui";
import { ReactNode } from "react";
import { IoIosListBox } from "react-icons/io";
import { Project } from "../../types/collection-api/resources/Project";
import { DinaMessage } from "../../intl/dina-ui-intl";
import Link from "next/link";

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
    <ProjectsSelectField resourcePath={resourcePath} />
  ) : (
    <div className={`${classNames} row`}>
      <DinaFormSection horizontal="flex">
        <div className="d-flex flex-row gap-1">
          <ProjectsSelectField
            resourcePath={resourcePath}
            className="flex-grow-1 mb-2"
          />
        </div>
      </DinaFormSection>
    </div>
  );
}

export interface ProjectSelectFieldProps {
  resourcePath?: string;
  className?: string;
  horizontal?: DinaFormSectionProps["horizontal"];
  icon?: ReactNode;
}

export function ProjectsSelectField({
  resourcePath,
  className,
  horizontal = "flex",
  icon = <IoIosListBox className="me-1" />
}: ProjectSelectFieldProps) {
  const { readOnly } = useDinaFormContext();
  return (
    <DinaFormSection horizontal={horizontal} readOnly={readOnly}>
      <ResourceSelectField<Project>
        name="projects"
        isMulti={true}
        readOnlyLink="/collection/project/view?id="
        filter={(searchValue: string) =>
          SimpleSearchFilterBuilder.create<Project>()
            .searchFilter("name", searchValue)
            .build()
        }
        model={resourcePath as any}
        className={"projects " + (className || "")}
        optionLabel={(prj) => prj.name}
        hideLabel={readOnly}
        removeLabel={readOnly}
        removeBottomMargin={true}
        label={
          <span>
            {icon} <DinaMessage id="projects" />
          </span>
        }
        readOnlyRender={(value, _) =>
          Array.isArray(value) && value.length !== 0 ? (
            <div className="d-flex flex-row mb-3 me-2">
              {value.map((val, idx) => (
                <Tooltip
                  key={idx}
                  visibleElement={
                    <div className="card pill py-1 px-2 d-flex flex-row align-items-center gap-1 label-default label-outlined">
                      <IoIosListBox />
                      <Link href={"/collection/project/view?id=" + val.id}>
                        {val.name}
                      </Link>
                    </div>
                  }
                  id="project"
                  disableSpanMargin={true}
                />
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
