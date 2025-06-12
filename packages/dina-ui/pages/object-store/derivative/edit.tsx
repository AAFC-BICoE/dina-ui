import { withResponse, BackButton, ButtonBar, SubmitButton } from "common-ui";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";
import { useDerivativeEditQuery } from "../../../components/object-store/metadata/useMetadata";
import { InputResource } from "kitsu";
import { DerivativeForm } from "../../../components/object-store/derivative/DerivativeForm";

export default function DerivativeEditPage() {
  const router = useRouter();
  const id = router.query.id?.toString();
  const { formatMessage } = useDinaIntl();
  const query = useDerivativeEditQuery(id);
  const title = "editDerivativeMetadata";
  const buttonBar = (
    <ButtonBar className="mb-3">
      <div className="col-md-6 mt-2">
        <BackButton entityId={id} entityLink="/object-store/derivative" />
      </div>
      <div className="col-md-6 flex d-flex ms-auto">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  );

  async function redirectToSingleDerivativePage(derivativeId: string) {
    await router?.push(`/object-store/derivative/view?id=${derivativeId}`);
  }
  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id={title} />
        </h1>
        <div>
          {withResponse(query, ({ data: editDerivative }) => (
            <DerivativeForm
              metadata={editDerivative as InputResource<Metadata>}
              onSaved={redirectToSingleDerivativePage}
              buttonBar={buttonBar}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export const DCTYPE_OPTIONS = [
  { label: "Image", value: "IMAGE" },
  { label: "Moving Image", value: "MOVING_IMAGE" },
  { label: "Sound", value: "SOUND" },
  { label: "Text", value: "TEXT" },
  { label: "Dataset", value: "DATASET" },
  { label: "Undetermined", value: "UNDETERMINED" }
];
