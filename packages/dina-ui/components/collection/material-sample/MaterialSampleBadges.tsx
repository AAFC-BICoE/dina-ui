import {
  withResponse
} from "common-ui";
import { AssemblageSelectSection } from "../../assemblage/AssemblageSelectSection";
import { ProjectSelectSection } from "../../project/ProjectSelectSection";
import { TagSelectReadOnly } from "../../tag-editor/TagSelectField";
import { TagsAndRestrictionsSection } from "../../tag-editor/TagsAndRestrictionsSection";
import { TransactionMaterialDirectionSection } from "../../transaction/TransactionMaterialDirectionSection";
import { MaterialSampleStateWarning } from "../MaterialSampleStateWarning";
import { CollectionSelectSection } from "../CollectionSelectSection";

export interface MaterialSampleBadgeProps {
  transactionElasticQuery: any;
}

export function MaterialSampleBadges({
  transactionElasticQuery
}: MaterialSampleBadgeProps) {
  return (
    <>
      <div className="d-flex flex-row gap-2">
        <MaterialSampleStateWarning />
        <TagsAndRestrictionsSection />
      </div>
      <div className="d-flex flex-row">
        <CollectionSelectSection />
        <ProjectSelectSection />
        <AssemblageSelectSection />
        {withResponse(
          transactionElasticQuery as any,
          ({ data: query }) => {
            return (
              <TransactionMaterialDirectionSection
                transactionElasticQuery={query}
              />
            );
          }
        )}

        {/* Tags */}
        <TagSelectReadOnly />
      </div>
    </>
  );
}