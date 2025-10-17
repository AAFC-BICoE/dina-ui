import { InputResource, PersistedResource } from "kitsu";
import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  MultilingualDescription,
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
      <ButtonBar className="mb-3">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={fetchedProtocol?.id}
            entityLink="/collection/protocol"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <ProtocolFormLayout />
    </DinaForm>
  );
}

export function ProtocolFormLayout() {
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  return (
    <>
      <div className="row">
        <TextField
          className="col-md-6 protocolName"
          name="name"
          label={formatMessage("protocolNameLabel")}
        />
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        )}
      </div>
      <div className="row">
        <VocabularySelectField
          className="col-md-6"
          name="protocolType"
          path="collection-api/vocabulary2/protocolType"
        />
      </div>
      <MultilingualDescription />
      <AttachmentsField
        name="attachments"
        title={<DinaMessage id="protocolAttachments" />}
        formId="protocol-attachments-section"
        allowNewFieldName="attachmentsConfig.allowNew"
        allowExistingFieldName="attachmentsConfig.allowExisting"
        hideAddAttchmentBtn={true}
      />
      <div className="row">
        <ProtocolsField />
      </div>
    </>
  );
}
