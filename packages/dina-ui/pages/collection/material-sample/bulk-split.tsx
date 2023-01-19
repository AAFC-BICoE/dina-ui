import { useEffect, useMemo, useState } from "react";
import { BackToListButton } from "common-ui/lib/button-bar/BackToListButton";
import PageLayout from "../../../components/page/PageLayout";
import { useLocalStorage } from "@rehooks/local-storage";
import {
  BackButton,
  DinaForm,
  RadioButtonsField,
  NumberSpinnerField,
  SubmitButton,
  DinaFormSection
} from "common-ui/lib";
import { Card } from "react-bootstrap";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

/**
 * String key for the local storage of the bulk split ids.
 */
const BULK_SPLIT_IDS = "bulk_split_ids";

const ENTITY_LINK = "/collection/material-sample";

export function MaterialSampleBulkSplitPage() {
  const { formatMessage } = useDinaIntl();

  const [ids] = useLocalStorage<string[]>(BULK_SPLIT_IDS, []);
  const isMultiple = useMemo(() => ids.length > 1, [ids]);

  // Clear local storage once the ids have been retrieved.
  useEffect(() => {
    localStorage.removeItem(BULK_SPLIT_IDS);
  }, ids);

  const buttonBar = (
    <>
      {/* Back Button (Changes depending on the number of records) */}
      {isMultiple ? (
        <BackToListButton entityLink={ENTITY_LINK} />
      ) : (
        <BackButton entityLink={ENTITY_LINK} entityId={ids[0]} />
      )}

      {/* Submit Button */}
      <SubmitButton className={"ms-auto"}>
        <DinaMessage id="splitButton" />
      </SubmitButton>
    </>
  );

  return (
    <DinaForm initialValues={{ numberToCreate: 1 }}>
      <PageLayout titleId="splitSubsampleTitle" buttonBarContent={buttonBar}>
        <>
          <Card>
            <Card.Body>
              <DinaMessage id="splitFrom" />:
            </Card.Body>
          </Card>

          <div className="row mt-3">
            <div className="col-md-6">
              <NumberSpinnerField
                name="numberToCreate"
                max={30}
                min={1}
                label={formatMessage("materialSamplesToCreate")}
              />
            </div>
            <div className="col-md-6">
              <RadioButtonsField<string>
                name="generationOption"
                horizontalOptions={true}
                options={[
                  { value: "continue", label: "Continue series" },
                  { value: "new", label: "New Series" }
                ]}
              />
            </div>
          </div>

          <div className="row mt-4">
            <h4>
              <DinaMessage id="previewLabel" />
            </h4>
          </div>
        </>
      </PageLayout>
    </DinaForm>
  );
}

export default MaterialSampleBulkSplitPage;
