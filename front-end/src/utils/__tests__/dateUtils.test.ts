import { formatDate, formatDateWithoutYear } from "../dateUtils";

describe("dateUtils", () => {
  describe("formatDate", () => {
    it("should format date correctly when date is valid", () => {
      expect(formatDate(new Date("2024-01-08T12:34:56Z"))).toEqual(
        "2024/01/08 20:34:56"
      );
    });

    it("should return dash when the date is invalid", () => {
      expect(formatDate(new Date("0001-01-01T12:34:56Z"))).toEqual("-");
    });
  });

  describe("formatDateWithoutYear", () => {
    it("should format date correctly when date is valid", () => {
      expect(formatDateWithoutYear(new Date("2024-01-08T12:34:56Z"))).toEqual(
        "01-08 20:34"
      );
    });

    it("should return dash when the date is invalid", () => {
      expect(formatDateWithoutYear(new Date("0001-01-01T12:34:56Z"))).toEqual(
        "-"
      );
    });
  });
});
