import { FC } from "react";
import { StyledTextField } from "../PlaceOrderModal.styles";
import { PageError, PlaceOrderFormData } from "../types";

export const InputField: FC<{
  id: keyof PlaceOrderFormData;
  placeholder: string;
  formData: PlaceOrderFormData;
  formError: PageError<PlaceOrderFormData>;
  onChange: (value: string) => void;
}> = ({ id, placeholder, formData, formError, onChange }) => {
  return (
    <StyledTextField
      margin="dense"
      type="text"
      color="primary"
      InputLabelProps={{ shrink: true }}
      value={formData[id]}
      autoFocus
      autoComplete="off"
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      error={!!formError[id]}
      helperText={formError[id]}
    />
  )
}