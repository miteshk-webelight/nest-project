import { Module } from "@nestjs/common";

import { CartsController } from "./carts.controller";
import { CartsService } from "./carts.service";

@Module({
  controllers: [CartsController],
  exports: [CartsService],
  providers: [CartsService],
})
export class CartsModule {}
