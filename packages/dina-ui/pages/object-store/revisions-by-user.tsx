import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../components";
import { RevisionsPageLayout } from "../../components/revisions/RevisionsPageLayout";
import { useDinaIntl, DinaMessage } from "../../intl/dina-ui-intl";
import { OBJECT_STORE_REVISION_ROW_CONFIG } from "../../components/revisions/revision-row-configs/objectstore-revision-row-configs";
import { Form, Formik } from "formik";
import { TextField, SubmitButton, safeSubmit } from "common-ui";

export default function RevisionsByUserPage() {
  const { query } = useRouter();
  const { formatMessage } = useDinaIntl();

  const author = query.author?.toString();

  const pageTitle = formatMessage("revisionsByUserPageTitle");

  return (
    <>
      <Head title={pageTitle} />
      <Nav />
      <div className="container-fluid">
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
      </div>
      <Footer />
    </>
  );
}

export function AuthorFilterForm() {
  const { pathname, push, query } = useRouter();

  /** Update the query string with the searched author. */
  async function onSubmit({ author }) {
    await push({ pathname, query: { author } });
  }

  return (
    <Formik
      initialValues={{ author: query.author?.toString() ?? "" }}
      onSubmit={safeSubmit(onSubmit)}
    >
      <Form>
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
      </Form>
    </Formik>
  );
}
