import { useState } from "react";
import { FormikButton, LoadingSpinner, TextField, useThrottledFetch } from "common-ui";
import DOMPurify from "dompurify";
import { Field, FormikProps } from "formik";
import moment from "moment";
import { ScientificNameSourceDetails } from "../../../../dina-ui/types/collection-api/resources/Determination";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { VocabularySelectField } from "../VocabularySelectField";
import { ClassificationInputRow } from "./ClassificationInputRow";
import useVocabularyOptions from "../../../../dina-ui/components/collection/useVocabularyOptions";

export interface IClassificationFieldProps {
  /** The determination index within the material sample. */
  index?: number;

  setValue?: (newValue: any) => void;

  onChange?: (selection: string | null, formik: FormikProps<any>) => void;

  formik?: FormikProps<any>;

  isDetermination?: boolean;

  initValue: string;

  /** Mock this out in tests so it gives a predictable value. */
  dateSupplier?: () => string;

  prevRank?: string;
}

export function ClassificationField({
  index,
  setValue,
  onChange,
  formik,
  isDetermination,
  initValue,
  dateSupplier,
  prevRank
}: IClassificationFieldProps) {
  const [manualClassificationItems, setManualClassificationItems] = useState<
    ManualClassificationItem[]
  >([{classificationRanks: 'rank1', classificationPath: ""},{classificationRanks: 'rank1', classificationPath: ""}]);

  

  return (
    <div className="card card-body">
      <div className="d-flex flex-column align-items-center">
        {manualClassificationItems.map((item, idxKey) => (
          <ClassificationInputRow prevRank={prevRank} rowIndex={idxKey} name="" key={idxKey} showPlusIcon={true} />
        ))}
      </div>
    </div>
  );
}
interface ManualClassificationItem {
  classificationRanks: string;
  classificationPath: string;
}

