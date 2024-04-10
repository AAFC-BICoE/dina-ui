import {
  withResponse
} from "common-ui";
import { AssemblageSelectSection } from "../../assemblage/AssemblageSelectSection";
import { ProjectSelectSection } from "../../project/ProjectSelectSection";
import { TagSelectReadOnly } from "../../tag-editor/TagSelectField";
import { TagsAndRestrictionsSection } from "../../tag-editor/TagsAndRestrictionsSection";
import { TransactionMaterialDirectionSection } from "../../transaction/TransactionMaterialDirectionSection";
import { MaterialSampleStateWarning } from "../MaterialSampleStateWarning";

export interface MaterialSampleBadgeProps {
  transactionElasticQuery: any;
}

export function MaterialSampleBadges({
  transactionElasticQuery
}: MaterialSampleBadgeProps) {
  return (
    <>
      <MaterialSampleStateWarning />

      <div className="d-flex flex-row gap-2">
        <TagsAndRestrictionsSection />
      </div>
      <div className="d-flex flex-row gap-2">
        <TagSelectReadOnly />
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
      </div>
    </>
  );
}