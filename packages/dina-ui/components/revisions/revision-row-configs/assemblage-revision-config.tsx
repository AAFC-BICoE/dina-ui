import { descriptionCell, titleCell } from "common-ui";
import Link from "next/link";
import { Assemblage } from "../../../types/collection-api";
import { Metadata } from "../../../types/objectstore-api";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";
import { ControlledVocabularyViewer } from "@dina-ui/components/controlled-vocabulary/ControlledVocabularyViewer";
import { COLLECTION_MANAGED_ATTRIBUTE_ID } from "@dina-ui/components/controlled-vocabulary/controlledVocabularyItemUtils";

export const ASSEMBLAGE_REVISION_ROW_CONFIG: RevisionRowConfig<Assemblage> = {
  name: ({ id, name }) => (
    <Link href={`/collection/assemblage/view?id=${id}`}>{name || id}</Link>
  ),
  customValueCells: {
    attachment: ({
      row: {
        original: { value }
      }
    }) => (
      <div>
        {value?.map(
          (relation) =>
            relation && (
              <div>
                <ReferenceLink<Metadata>
                  type="metadata"
                  baseApiPath="objectstore-api"
                  reference={relation}
                  name={({ originalFilename, id }) => originalFilename || id}
                  href="/object-store/object/view?id="
                />
              </div>
            )
        )}
      </div>
    ),
    multilingualTitle: titleCell(true, false, "multilingualTitle").cell,
    multilingualDescription: descriptionCell(
      true,
      false,
      "multilingualDescription"
    ).cell,

    // Show the entire value of the metadata map in a key-value table:
    managedAttributes: ({
      row: {
        original: { value }
      }
    }) => (
      <ControlledVocabularyViewer
        values={value}
        baseApi="collection-api"
        dinaComponent="ASSEMBLAGE"
        controlledVocabularyUUID={COLLECTION_MANAGED_ATTRIBUTE_ID}
      />
    )
  }
};
