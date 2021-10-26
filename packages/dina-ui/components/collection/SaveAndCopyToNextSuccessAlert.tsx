import { BsFillFileEarmarkCheckFill } from "react-icons/bs";

export interface SaveAndCopyToNextSuccessAlertProps {
  id: string;
  entityPath: string;
  className?: string;
}

export function SaveAndCopyToNextSuccessAlert({
  id,
  entityPath,
  className
}: SaveAndCopyToNextSuccessAlertProps) {
  return (
    <div className="alert alert-success">
      <div className=" d-flex gap-3">
        <BsFillFileEarmarkCheckFill style={{ width: "24px", height: "24px" }} />
        <a href={`/${entityPath}/edit?id=${id}`} className={className}>
          {id}
        </a>
      </div>
    </div>
  );
}
