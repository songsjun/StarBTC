import { TokenOrNative } from "@services/tokens/token-or-native";
import { FC } from "react";

export const TokenIcon: FC<React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> & {
  token: TokenOrNative;
}> = ({ token, ...props }) => {
  if (!token?.icon)
    return null;

  return <img src={token.icon} {...props} />
}
