import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import React from "react";
import { CommonMessage } from "../intl/common-ui-intl";
import { FaFileArrowUp } from "react-icons/fa6";

interface UploadDerivativeButtonProps {
  acDerivedFrom: string;
}

export function UploadDerivativeButton({
  acDerivedFrom
}: UploadDerivativeButtonProps) {
  return (
    <DropdownButton
      title={
        <>
          <FaFileArrowUp className="me-2" />
          <CommonMessage id="uploadDerivative" />
        </>
      }
    >
      <Dropdown.Item
        href={`/object-store/upload?derivativeType=THUMBNAIL_IMAGE&acDerivedFrom=${acDerivedFrom}`}
      >
        <CommonMessage id="thumbnailImage" />
      </Dropdown.Item>
      <Dropdown.Item
        href={`/object-store/upload?derivativeType=LARGE_IMAGE&acDerivedFrom=${acDerivedFrom}`}
      >
        <CommonMessage id="largeImage" />
      </Dropdown.Item>
    </DropdownButton>
  );
}
