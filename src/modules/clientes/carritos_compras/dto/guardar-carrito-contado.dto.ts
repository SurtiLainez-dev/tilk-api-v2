
import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';

import {
    Transform,
    Type,
} from 'class-transformer';

export class GuardarLineaContadoDto {
    @IsString()
    @IsNotEmpty()
    articulo_slug!: string;

    @IsString()
    @Matches(/^[1-9]\d*$/, {
        message: 'tk2_precio_id debe ser un identificador válido.',
    })
    tk2_precio_id!: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    plan_slug?: string | null;

    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    @Max(100000)
    cantidad!: number;
}

export class GuardarCarritoContadoDto {
    @IsString()
    @IsNotEmpty()
    cliente_slug!: string;

    @IsOptional()
    @IsString()
    carrito_slug?: string | null;

    @IsOptional()
    @IsString()
    nombre?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type((): typeof GuardarLineaContadoDto => GuardarLineaContadoDto)
    articulos!: GuardarLineaContadoDto[];
}
