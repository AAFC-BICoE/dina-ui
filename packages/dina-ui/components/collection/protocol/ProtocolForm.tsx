import { InputResource, PersistedResource } from "kitsu";
import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  TextField,
  useDinaFormContext
} from "../../../../common-ui/lib";
import {
  DinaMessage,
  useDinaIntl
} from "../../../../dina-ui/intl/dina-ui-intl";
import { Protocol } from "../../../../dina-ui/types/collection-api";
import { useContext } from "react";
import { GroupSelectField } from "../../group-select/GroupSelectField";
import { AttachmentsField } from "../../object-store/attachment-list/AttachmentsField";
import { ProtocolsField } from "./ProtocolDataField";
import { useProtocolFormConverter } from "./useProtocolFormConverter";
import { VocabularySelectField } from "../VocabularySelectField";

export interface ProtocolFormValue extends InputResource<Protocol> {
  multilingualDescription?: Record<string, string | undefined>;
  protocolFormData?:
    | {
        select?: string;
        vocabularyBased?: boolean;
        rows?:
          | {
              type?: string;
              value?: string;
              vocabularyBased?: boolean;
              unit?: string | null;
            }[]
          | null;
      }[]
    | null;
}

export interface ProtocolFormProps {
  fetchedProtocol?: Protocol;
  onSaved: (protocol: PersistedResource<Protocol>) => Promise<void>;
}

export function ProtocolForm({ fetchedProtocol, onSaved }: ProtocolFormProps) {
  const { save } = useContext(ApiClientContext);
  const { convertProtocolToFormData, convertFormDataToProtocol } =
    useProtocolFormConverter();

  const initialValues: ProtocolFormValue =
    convertProtocolToFormData(fetchedProtocol);

  const onSubmit: DinaFormOnSubmit<ProtocolFormValue> = async ({
    submittedValues
  }) => {
    const input = convertFormDataToProtocol(submittedValues);

    const [savedProtocol] = await save<Protocol>(
      [
        {
          resource: input,
          type: "protocol"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );
    await onSaved(savedProtocol);
  };

  return (
    <DinaForm<ProtocolFormValue>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar>
        <BackButton
          entityId={fetchedProtocol?.id}
          entityLink="/collection/protocol"
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <ProtocolFormLayout />
    </DinaForm>
  );
}

export function ProtocolFormLayout() {
  const { initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  return (
    <>
      <div className="row">
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <div className="row">
        <TextField
          className="col-md-6 protocolName"
          name="name"
          label={formatMessage("protocolNameLabel")}
        />
      </div>
      <div className="row">
        <VocabularySelectField
          className="col-md-6"
          name="protocolType"
          path="collection-api/vocabulary/protocolType"
        />
      </div>
      <div className="row">
        <TextField
          className="english-description"
          name="multilingualDescription.en"
          label={formatMessage("field_description.en")}
          multiLines={true}
        />
      </div>
      <div className="row">
        <TextField
          className="french-description"
          name="multilingualDescription.fr"
          label={formatMessage("field_description.fr")}
          multiLines={true}
        />
      </div>
      <AttachmentsField
        name="attachments"
        title={<DinaMessage id="protocolAttachments" />}
        id="protocol-attachments-section"
        allowNewFieldName="attachmentsConfig.allowNew"
        allowExistingFieldName="attachmentsConfig.allowExisting"
        attachmentPath={`collection-api/protocol/${initialValues?.id}/attachments`}
        hideAddAttchmentBtn={true}
      />
      <div className="row">
        <ProtocolsField />
      </div>
    </>
  );
}
