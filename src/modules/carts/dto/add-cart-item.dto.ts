import { ApiProperty } from "@nestjs/swagger";

import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, Min } from "class-validator";

import { TrimString } from "src/decorators/trim-string.decorator";

export class AddCartItemDto {
  @ApiProperty()
  @TrimString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}
