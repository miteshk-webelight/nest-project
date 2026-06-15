/* eslint-disable @cspell/spellchecker */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, ValidateIf } from "class-validator";

import { TrimString } from "src/decorators/trim-string.decorator";

import { EmailProviderEnum } from "../email.constants";

export class SaveEmailProviderDto {
  @ApiProperty({
    enum: EmailProviderEnum,
    description: "Email provider to configure",
    example: EmailProviderEnum.RESEND,
  })
  @IsNotEmpty()
  @IsEnum(EmailProviderEnum)
  provider: EmailProviderEnum;

  @ApiPropertyOptional({
    nullable: true,
    description: "Resend API key. Required when provider is RESEND",
    example: "re_123456789abcdef",
  })
  @ValidateIf((o) => o.provider === EmailProviderEnum.RESEND)
  @IsString()
  @TrimString()
  resendApiKey?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: "Brevo API key. Required when provider is BREVO",
    example: "xkeysib-123456789",
  })
  @ValidateIf((o) => o.provider === EmailProviderEnum.BREVO)
  @IsNotEmpty()
  @TrimString()
  brevoApiKey?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: "SMTP host. Required when provider is SMTP",
    example: "smtp.gmail.com",
  })
  @ValidateIf((o) => o.provider === EmailProviderEnum.SMTP)
  @IsNotEmpty()
  @TrimString()
  host?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: "SMTP port. Required when provider is SMTP",
    example: 587,
  })
  @ValidateIf((o) => o.provider === EmailProviderEnum.SMTP)
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  port?: number;

  @ApiPropertyOptional({
    nullable: true,
    description: "SMTP username. Required when provider is SMTP",
    example: "support@yourdomain.com",
  })
  @ValidateIf((o) => o.provider === EmailProviderEnum.SMTP)
  @IsNotEmpty()
  @IsString()
  @TrimString()
  username?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: "SMTP password. Required when provider is SMTP",
    example: "super-secret-password",
  })
  @ValidateIf((o) => o.provider === EmailProviderEnum.SMTP)
  @TrimString()
  @IsNotEmpty()
  password?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: "Sender email address used for outgoing emails",
    example: "noreply@yourdomain.com",
  })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value))
  fromEmail?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: "Email address used for provider validation before saving configuration",
    example: "admin@yourdomain.com",
  })
  @IsOptional()
  @IsEmail()
  testEmail?: string;
}
