
export interface PlaceOrderFormData {
  deposited: string;
}

export type PageError<T> = {
  [key in keyof T]?: string;
};
