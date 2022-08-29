import { PersistedResource } from "kitsu";
import { FieldSet, DinaForm } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";
import React from "react";
import Link from "next/link";

export interface InheritiedDeterminationSectionProps {
  materialSample: PersistedResource<MaterialSample>;
}

export default function InheritedDeterminationSection({
  materialSample
}: InheritiedDeterminationSectionProps) {
  // Find first parent with targetOrganismPrimaryDetermination in hierachy
  const parentWithDetermination = materialSample.hierarchy?.find(
    (hierachyItem) =>
      hierachyItem.hasOwnProperty("organismPrimaryDetermination")
  );

  const inheritedDeterminations =
    parentWithDetermination?.organismPrimaryDetermination.reduce();

  const parentLink = (
    <Link
      href={`/collection/material-sample/view?id=${parentWithDetermination?.uuid}`}
    >
      <a>{parentWithDetermination?.name}</a>
    </Link>
  );
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
          {inheritedDeterminations[0].scientificName}
        </div>
      </DinaForm>
    </FieldSet>
  );
}
