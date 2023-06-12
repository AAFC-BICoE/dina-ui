import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import React from "react";
import { CommonMessage } from "../intl/common-ui-intl";

interface UploadDerivativeButtonProps {
  acDerivedFrom: string;
}

export function UploadDerivativeButton({
  acDerivedFrom
}: UploadDerivativeButtonProps) {
  return (
    <DropdownButton
      title={<CommonMessage id="uploadDerivative" />}
      className="me-2"
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
