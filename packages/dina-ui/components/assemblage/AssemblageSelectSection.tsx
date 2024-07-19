import {
  DinaFormSection,
  filterBy,
  ResourceSelectField,
  Tooltip,
  useDinaFormContext
} from "common-ui";
import { FaFolderOpen } from "react-icons/fa";
import { Assemblage } from "../../../dina-ui/types/collection-api/resources/Assemblage";
import { DinaMessage } from "../../intl/dina-ui-intl";
import Link from "next/link";

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
        <div className="d-flex flex-row gap-1">
          <AssemblageSelectField
            resourcePath={resourcePath}
            className="flex-grow-1 mb-2"
          />
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
        removeBottomMargin={true}
        label={
          <span>
            <FaFolderOpen className="me-1" /> <DinaMessage id="assemblages" />
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
                      <FaFolderOpen />
                      <Link href={"/collection/assemblage/view?id=" + val.id}>
                        {val.name}
                      </Link>
                    </div>
                  }
                  id="assemblage"
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
