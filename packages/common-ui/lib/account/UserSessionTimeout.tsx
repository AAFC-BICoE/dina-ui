import moment from "moment";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import React, { ReactNode, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { FormattedMessage } from "react-intl";
import { AreYouSureModal, useAccount, useModal } from "..";

export function UserSessionTimeout({ children }: { children: ReactNode }) {
  const { openModal } = useModal();
  const { logout } = useAccount();
  const current = moment().valueOf();
  const future = current + 5000;

  const [timeLeft, setTimeLeft] = useState(future - moment().valueOf());

  const handleOnIdle = () => {
    setTimeLeft(timeLeft - 1000);
    openModal(
      <AreYouSureModal
        actionMessage={<DinaMessage id="sessionTimeoutWarning" />}
        onYesButtonClicked={() => logout()}
        messageBody={
          <FormattedMessage id="sessionAboutToExpire" values={{ timeLeft }} />
        }
      />
    );
  };

  useIdleTimer({
    timeout: 15 * 1000,
    onIdle: handleOnIdle,
    // onAction: handleOnAction,
    debounce: 50
  });

  return <>{children}</>;
}
