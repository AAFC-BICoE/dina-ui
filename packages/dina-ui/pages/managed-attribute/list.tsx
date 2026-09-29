import Link from "next/link";
import PageLayout from "../../components/page/PageLayout";
import { DinaMessage } from "../../intl/dina-ui-intl";

export default function ManagedAttributesListPage() {
  return (
    <PageLayout titleId="managedAttributes">
      <div className="alert alert-warning mt-3" role="alert">
        <h5>
          <DinaMessage id="allManagedAttributesMovedAlertTitle" />
        </h5>
        <DinaMessage
          id="managedAttributeTabAlertDescription"
          values={{
            link: (
              <Link href="/controlled-vocabulary/list">
                <DinaMessage id="controlledVocabularyTitle" />
              </Link>
            )
          }}
        />
      </div>
    </PageLayout>
  );
}
