import {
    IsOptional,
    IsString,
    IsIn,
    IsInt,
    Min,
    Max,
    MaxLength,
} from 'class-validator';

import { Type } from 'class-transformer';

export class ConsultarCuentasDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    buscar?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsIn([1, 2])
    estado?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pagina: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limite: number = 20;
}