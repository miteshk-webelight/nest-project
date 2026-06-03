import { BadRequestException } from "@nestjs/common";

import { ADDRESS_ERROR_MESSAGES } from "../user.constants";

import type { PostalApiResponse } from "../postal-api.types";

export function validateAddress(apiData: PostalApiResponse[], city: string, state: string, postalCode: string): void {
  const [result] = apiData;

  if (result.Status !== "Success" || !result.PostOffice) {
    throw new BadRequestException(ADDRESS_ERROR_MESSAGES.POSTAL_CODE_NOT_EXISTS(postalCode));
  }

  const [verifiedRecord] = result.PostOffice;
  const normalizedState = state.toLowerCase().trim();
  const normalizedCity = city.toLowerCase().trim();
  const apiState = verifiedRecord.State.toLowerCase().trim();
  const apiDistrict = verifiedRecord.District.toLowerCase().trim();

  const isStateValid = normalizedState === apiState;
  const isCityValid = apiDistrict.includes(normalizedCity) || normalizedCity.includes(apiDistrict);

  if (!isStateValid || !isCityValid) {
    throw new BadRequestException(
      ADDRESS_ERROR_MESSAGES.ADDRESS_MISMATCH(postalCode, verifiedRecord.District, verifiedRecord.State),
    );
  }
}
