import ReactSwitch, { ReactSwitchProps } from "react-switch";

/** A smaller react-switch. Explicit props still override the small preset. */
export function SmallSwitch(props: ReactSwitchProps) {
  return (
    <ReactSwitch
      height={18}
      width={34}
      handleDiameter={14}
      checkedIcon={false}
      uncheckedIcon={false}
      {...props}
    />
  );
}
