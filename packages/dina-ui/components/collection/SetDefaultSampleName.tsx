import { useFormikContext } from "formik";
import { useEffect, useRef } from "react";
import { MaterialSample } from "../../types/collection-api";

/** Prefixes the sample name with the collection code. */
export function SetDefaultSampleName() {
  const { values, setFieldValue } = useFormikContext<Partial<MaterialSample>>();
  const previousDefaultName = useRef("");

  useEffect(() => {
    const defaultSampleName = values.collection?.code || "";
    const currentName = values.materialSampleName || "";

    // When the collection is changed, change the sample
    if (
      currentName.startsWith(previousDefaultName.current) &&
      !currentName.startsWith(defaultSampleName)
    ) {
      setFieldValue(
        "materialSampleName",
        currentName.replace(previousDefaultName.current, defaultSampleName)
      );
    }

    previousDefaultName.current = defaultSampleName;
  }, [values.collection]);

  return null;
}
