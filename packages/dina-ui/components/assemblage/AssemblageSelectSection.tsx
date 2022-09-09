import {
  DinaFormSection,
  filterBy,
  ResourceSelectField,
  useDinaFormContext
} from "common-ui";
import { FaFolderOpen } from "react-icons/fa";
import { Assemblage } from "../../../dina-ui/types/collection-api/resources/Assemblage";
import { DinaMessage } from "../../intl/dina-ui-intl";

export interface AssemblageSelectSectionProps {
  resourcePath?: string;
  classNames?: string;
}

export function AssemblageSelectSection({
  resourcePath,
  classNames
}: AssemblageSelectSectionProps) {
  const { readOnly } = useDinaFormContext();
  return readOnly ? (
    <AssemblageSelectField resourcePath={resourcePath} />
  ) : (
    <div className={`${classNames} row`}>
      <DinaFormSection horizontal="flex">
        <div className="col-md-6">
          <div className="d-flex flex-row gap-1">
            <AssemblageSelectField
              resourcePath={resourcePath}
              className="flex-grow-1 mb-2"
            />
          </div>
        </div>
      </DinaFormSection>
    </div>
  );
}

export interface AssemblageSelectFieldProps {
  resourcePath?: string;
  className?: string;
}

export function AssemblageSelectField({
  resourcePath,
  className
}: AssemblageSelectFieldProps) {
  const { readOnly } = useDinaFormContext();
  return (
    <DinaFormSection horizontal={"flex"} readOnly={readOnly}>
      <ResourceSelectField<Assemblage>
        name="assemblages"
        isMulti={true}
        readOnlyLink="/collection/assemblage/view?id="
        filter={filterBy(["name"])}
        model={resourcePath as any}
        className={"assemblages " + (className || "")}
        optionLabel={(assemblage) => assemblage.name}
        hideLabel={readOnly}
        removeLabel={readOnly}
        label={
          <span>
            <FaFolderOpen /> <DinaMessage id="assemblages" />
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
