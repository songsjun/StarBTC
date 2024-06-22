import { find, isNil } from "lodash";
import { useState } from "react";

import { Tooltip } from "@mui/material";
import { StyledToggleButton, StyledToggleButtonGroup } from "./Tab.styles";

export type TabOption<V> = {
  name: string;
  value: V & {};
  tooltip?: string | null;
};

interface TabProps<T extends TabOption<T["value"]>> {
  options: T[];
  defaultOption?: T;
  onChange?: (e: React.MouseEvent<HTMLElement, MouseEvent>, option: T) => void;
  disabled?: boolean;
}

export const Tab = <T extends TabOption<T["value"]>>({
  options,
  onChange,
  defaultOption,
  disabled = false,
}: TabProps<T>) => {
  const [option, setOption] = useState(defaultOption || options[0]);

  const handleChange = (
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    value: any | null
  ) => {
    if (isNil(value)) {
      return;
    }
    const matchedOption = find(options, { value }) as T;
    setOption(matchedOption);
    onChange?.(e, matchedOption);
  };

  return (
    <StyledToggleButtonGroup
      value={option.value}
      exclusive
      onChange={handleChange}
      disabled={disabled}
    >
      {options.map(({ name, value, tooltip }) => (
        <Tooltip title={tooltip} key={name}>
          <StyledToggleButton value={value}>
            {name}
          </StyledToggleButton>
        </Tooltip>
      ))}
    </StyledToggleButtonGroup>
  );
};
