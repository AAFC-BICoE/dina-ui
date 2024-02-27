import {useState} from "react";
import { FormikButton, LoadingSpinner, useThrottledFetch } from "common-ui";
import DOMPurify from "dompurify";
import { Field, FormikProps } from "formik";
import moment from "moment";
import { ScientificNameSourceDetails } from "../../../../dina-ui/types/collection-api/resources/Determination";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { VocabularySelectField } from "../VocabularySelectField";

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
}

export function ClassificationField({
  index,
  setValue,
  onChange,
  formik,
  isDetermination,
  initValue,
  dateSupplier
}: IClassificationFieldProps) {
  const [manualClassificationItems, setManualClassificationItems] = useState<ManualClassificationItem[]>([]);

  return (
    <div className="card card-body">
      <div className="d-flex flex-column align-items-center">
      {manualClassificationItems.map(item => (
        <ClassificationInputRow value={item} />
      ))}
      </div>;
    </div>
  );
}
interface ManualClassificationItem {
  classificationRanks: string,
  classificationPath: string
}

export function ClassificationInputRow({index, value}: {index: number, value: ManualClassificationItem}) {
  
  return <>
    <VocabularySelectField
          name={`taxonomicRank`}
          path="collection-api/vocabulary/taxonomicRank"  />
  </>;
}
