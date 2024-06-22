import { useMediaQuery, useTheme } from "@mui/material";
import { FC } from "react";
import { Link } from "react-router-dom";

import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { formatAddress } from "../../../utils";
import { CopyField } from "../CopyField";
import { CopyFieldProps } from "../CopyField/CopyField";

export const ExternalCopyText: FC<{
  type: "tx" | "address";
  value: string;
  shorten?: boolean;
  keep?: [number, number];
} & Omit<CopyFieldProps, "displayValue" | "value">> = (props) => {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("sm"));
  const chainConfig = useActiveEVMChainConfig();
  const { type, value, shorten = true, keep = matches ? [4, 4] : [6, 6], ...rest } = props;
  const externalHref = type === "tx" ? `${chainConfig?.explorers[0]}/tx/${value}` : `${chainConfig?.explorers[0]}/address/${value}/transactions`;

  return (
    <CopyField
      {...rest}
      value={value}
      displayValue={
        <Link
          target="__blank"
          to={externalHref}
          style={{ color: "inherit" }}
          onClick={(e) => e.stopPropagation()}
        >
          {shorten ? formatAddress(value, keep) : value}
        </Link>
      }
    />
  );
};
