import { PersistedResource } from "kitsu";
import { FieldSet, DinaForm } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";
import React from "react";

export interface InheritiedDeterminationSectionProps {
  materialSample: PersistedResource<MaterialSample>;
  parentLink: JSX.Element;
  inheritedDetermination: any;
}

export default function InheritedDeterminationSection({
  materialSample,
  parentLink,
  inheritedDetermination: inheritedDetermination
}: InheritiedDeterminationSectionProps) {
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
          {inheritedDetermination.scientificName}
        </div>
      </DinaForm>
    </FieldSet>
  );
}
