import { DinaForm, useStringArrayConverter } from "common-ui";
import { ViewPageLayout } from "../../../components";
import {
  SequencingFacilityContactVO,
  SequencingFacilityVO
} from "../../../types/seqdb-api/resources/SequencingFacility";
import { SequencingFacilityFormFields } from "./edit";

export default function SequencingFacilityDetailsPage() {
  const [convertArrayToString, convertStringToArray] =
    useStringArrayConverter();
  return (
    <ViewPageLayout<SequencingFacilityVO>
      mainClass="container-fluid"
      form={(props) => (
        <DinaForm {...props}>
          {({ values }) => <SequencingFacilityFormFields formValues={values} />}
        </DinaForm>
      )}
      query={(id) => ({ path: `seqdb-api/sequencing-facility/${id}` })}
      entityLink="/seqdb/sequencing-facility"
      type="sequencing-facility"
      apiBaseUrl="/seqdb-api"
      alterInitialValues={(resources) => {
        const contactArrayVO = (resources.contacts || []).map(
          (contact) =>
            ({
              ...contact,
              roles: convertArrayToString((contact.roles || []) as string[])
            } as SequencingFacilityContactVO)
        );

        const facilityVO: SequencingFacilityVO = {
          ...resources,
          contacts: contactArrayVO
        };
        return facilityVO;
      }}
    />
  );
}
