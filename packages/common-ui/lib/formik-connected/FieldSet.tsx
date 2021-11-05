import { DinaFormSection, DinaFormSectionProps } from "./DinaForm";

export interface FieldSetProps extends DinaFormSectionProps {
  /** fieldset title. */
  legend: JSX.Element;

  className?: string;

  id?: string;
}

/** Wrapper around HTML fieldset element with Bootstrap styling. */
export function FieldSet({
  legend,
  className,
  id,
  ...formSectionProps
}: FieldSetProps) {
  return (
    <fieldset
      className={`mb-3 border card px-4 py-2 ${className ?? ""}`}
      id={id}
    >
      <legend className="w-auto"><h2 className="fieldset-h2-adjustment">{legend}</h2></legend>
      <DinaFormSection {...formSectionProps} />
    </fieldset>
  );
}
