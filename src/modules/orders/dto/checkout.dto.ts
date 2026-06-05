import { ApiProperty } from "@nestjs/swagger";

import { IsNotEmpty } from "class-validator";

import { TrimString } from "src/decorators/trim-string.decorator";

export class CheckoutDto {
  @ApiProperty()
  @TrimString()
  @IsNotEmpty()
  addressId: string;
}
