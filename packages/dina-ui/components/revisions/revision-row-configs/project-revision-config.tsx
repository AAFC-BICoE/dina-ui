import { descriptionCell } from "common-ui";
import Link from "next/link";
import { Project } from "../../../types/collection-api";
import { Metadata } from "../../../types/objectstore-api";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const PROJECT_REVISION_ROW_CONFIG: RevisionRowConfig<Project> = {
  name: ({ id, name }) => (
    <Link href={`/collection/project/view?id=${id}`}>{name || id}</Link>
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
    multilingualDescription: descriptionCell(
      true,
      false,
      "multilingualDescription"
    ).cell
  }
};
