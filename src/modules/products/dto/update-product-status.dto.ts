import { ApiProperty } from "@nestjs/swagger";

import { IsEnum } from "class-validator";

import { TrimString } from "../../../decorators/trim-string.decorator";
import { ProductStatusEnum } from "../products.constants";

export class UpdateProductStatusDto {
  @ApiProperty()
  @TrimString()
  @IsEnum(ProductStatusEnum)
  status: ProductStatusEnum;
}
