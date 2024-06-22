import { OpenInNewRounded } from "@mui/icons-material";
import { useActiveEVMChainConfig } from "@services/chains/hooks/useActiveEVMChainConfig";
import { useNetworkMode } from "@services/network/hooks/useNetworkMode";
import { FC, useMemo } from "react";
import { Link } from "react-router-dom";

export enum ExternalLinkType {
  EVM,
  BTC
}

export const LinkToExternalTx: FC<{ tx: string, target?: ExternalLinkType }> = (props) => {
  const { tx, target = ExternalLinkType.EVM } = props;

  const chainConfig = useActiveEVMChainConfig();
  const { isMainnet } = useNetworkMode();

  const url = useMemo(() => {
    switch (target) {
      case ExternalLinkType.EVM:
        return `${chainConfig?.explorers[0]}/tx/${tx}`;
      case ExternalLinkType.BTC:
        // Use blockstream for testnet because mempool space seems to be brokem
        return isMainnet ? `https://mempool.space/tx/${tx}` : `https://blockstream.info/testnet/tx/${tx}`;
    }
  }, [target, chainConfig, tx, isMainnet]);

  return (
    // Flex display used to vertically center in rows
    <Link target="__blank" to={url} style={{ display: "flex" }}>
      <OpenInNewRounded />
    </Link>
  );
};
