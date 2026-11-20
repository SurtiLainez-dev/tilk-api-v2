import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class RegistrarEgresoDto {
    @Type(() => Number)
    @IsNumber(
        { maxDecimalPlaces: 2 },
        { message: 'El monto debe tener máximo dos decimales.' },
    )
    @Min(0.01)
    @Max(999999999)
    montoDepositado!: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    referencia!: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    observacion?: string;

    @IsOptional()
    @IsString()
    slug?: string;
}