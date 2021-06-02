interface NumberSpinnerProps {
  onChange?: (e) => void;
  min?: number;
  max?: number;
  defaultValue?: number;
  size?: number;
  step?: number;
}

export default function NumberSpinner(props: NumberSpinnerProps) {
  const { min, max, defaultValue, size, step, onChange } = props;

  const onChangeInternal = e => {
    onChange?.(e);
  };

  return (
    <input
      className="form-control"
      type="number"
      min={min ?? 1}
      max={max ?? ""}
      defaultValue={defaultValue ?? 1}
      size={size ?? 4}
      step={step ?? 1}
      onChange={onChangeInternal}
    />
  );
}
