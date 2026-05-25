import { OmitType, PartialType } from "@nestjs/swagger";

import { CreateUserDto } from "./users.dto";

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ["email", "password"] as const)) {}
