import { FaBook } from "react-icons/fa";
import { MouseEventHandler } from "react";

interface CopyPasteWorkbookButtonProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export default function CopyPasteWorkbookButton({
  onClick
}: CopyPasteWorkbookButtonProps) {
  return (
    <button
      onClick={onClick}
      className="btn btn-primary"
      style={{
        fontSize: "1.3rem",
        margin: "20px auto",
        width: "10rem"
      }}
    >
      <FaBook style={{ marginRight: "10px" }} />
      {">>"}
    </button>
  );
}
