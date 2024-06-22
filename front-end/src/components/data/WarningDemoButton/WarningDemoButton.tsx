import { FC, ReactNode, useState } from "react";
import { ContinueLink, WarningRoot, WarningTitle } from "./WarningDemoButton.styles";

/**
 * While this app is a demo, this component blocks important actions such as make/take order
 * to first let user know about the risks. Once accepted, user can reach the expected actions
 */
export const WarningDemoButton: FC<{
  action: string;
  fullWidth?: boolean;
  children: ReactNode;
}> = ({ action, fullWidth = false, children }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <>
      {
        !agreed &&
        <WarningRoot onClick={() => setAgreed(true)} style={{ width: fullWidth ? "100%" : "auto" }}>
          <WarningTitle>DEMO version - use at your own risks</WarningTitle>
          <ContinueLink>I agree, continue to {action}</ContinueLink>
        </WarningRoot>
      }
      {
        agreed && <>{children}</>
      }
    </>
  )
}