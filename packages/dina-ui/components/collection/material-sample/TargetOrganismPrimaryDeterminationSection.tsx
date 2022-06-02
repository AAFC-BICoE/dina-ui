import { PersistedResource } from "kitsu";
import { FieldSet, DinaForm } from "packages/common-ui/lib";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import React from "react";

export interface TargetOrganismPrimaryDeterminationSectionProps {
  materialSample: PersistedResource<MaterialSample>;
  parentLink: JSX.Element;
  inheritedTargetOrganismPrimaryDetermination: any;
}

export default function TargetOrganismPrimaryDeterminationSection({
  materialSample,
  parentLink,
  inheritedTargetOrganismPrimaryDetermination
}: TargetOrganismPrimaryDeterminationSectionProps) {
  return (
    <FieldSet legend={<DinaMessage id="determination" />}>
      {materialSample.parentMaterialSample && (
        <div
          style={{
            marginLeft: "16px"
          }}
          className="mb-3"
        >
          <DinaMessage id="fromParent" values={{ parentLink }} />
        </div>
      )}
      <DinaForm initialValues={{}} readOnly={true}>
        <div className="mb-1">
          <div>
            <strong>
              <DinaMessage
                id="field_scientificNameInput"
                values={{ parentLink }}
              />
            </strong>
          </div>
          {inheritedTargetOrganismPrimaryDetermination.scientificName}
        </div>
      </DinaForm>
    </FieldSet>
  );
}
