import { FC } from "react";
import { ContinueLink, WarningRoot, WarningTitle } from "./PreStepButton.styles";

/**
 * Button that shows 2 smaller lines to indicate user that there is a step to complete
 * before accessing the real feature. For example, connect wallet before accessing place order.
 */
export const PreStepButton: FC<{
  title: string;
  continuesTo: string;
  onClick: () => void;
  fullWidth?: boolean;
}> = ({ title, continuesTo, onClick, fullWidth = false }) => {
  return (
    <>
      <WarningRoot onClick={onClick} style={{ width: fullWidth ? "100%" : "auto" }}>
        <WarningTitle>{continuesTo}</WarningTitle>
        <ContinueLink>{title}</ContinueLink>
      </WarningRoot>
    </>
  )
}