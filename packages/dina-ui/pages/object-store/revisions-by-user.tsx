import { DinaForm, DinaFormOnSubmit, SubmitButton, TextField } from "common-ui";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../components";
import { OBJECT_STORE_REVISION_ROW_CONFIG } from "../../components/revisions/revision-row-configs/objectstore-revision-row-configs";
import { RevisionsPageLayout } from "../../components/revisions/RevisionsPageLayout";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export default function RevisionsByUserPage() {
  const { query } = useRouter();
  const { formatMessage } = useDinaIntl();

  const author = query.author?.toString();

  const pageTitle = formatMessage("revisionsByUserPageTitle");

  return (
    <>
      <Head title={pageTitle} />
      <Nav />
      <main className="container-fluid">
        <h1>{pageTitle}</h1>
        <AuthorFilterForm />
        {
          // Only show the revisions table if the author is set:
          author && (
            <RevisionsPageLayout
              auditSnapshotPath="objectstore-api/audit-snapshot"
              author={author}
              revisionRowConfigsByType={OBJECT_STORE_REVISION_ROW_CONFIG}
            />
          )
        }
      </main>
      <Footer />
    </>
  );
}

export function AuthorFilterForm() {
  const { pathname, push, query } = useRouter();

  /** Update the query string with the searched author. */
  const onSubmit: DinaFormOnSubmit = async ({
    submittedValues: { author }
  }) => {
    await push({ pathname, query: { author } });
  };

  return (
    <DinaForm
      initialValues={{ author: query.author?.toString() ?? "" }}
      onSubmit={onSubmit}
    >
      <ul className="list-inline">
        <li className="list-inline-item">
          <TextField name="author" />
        </li>
        <li className="list-inline-item">
          <SubmitButton>
            <DinaMessage id="searchButton" />
          </SubmitButton>
        </li>
      </ul>
    </DinaForm>
  );
}
