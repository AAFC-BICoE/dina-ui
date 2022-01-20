import { Project } from "../../../types/collection-api";
import { Metadata } from "../../../types/objectstore-api";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";
import Link from "next/link";

export const PROJECT_REVISION_ROW_CONFIG: RevisionRowConfig<Project> = {
  name: ({ id, name }) => (
    <Link href={`/collection/project/view?id=${id}`}>
      <a>{name || id}</a>
    </Link>
  ),
  customValueCells: {
    attachment: ({ original: { value } }) => (
      <div>
        {value?.map(
          relation =>
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
    )
  }
};
