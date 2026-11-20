
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
} from 'class-validator';

export class AgregarArticuloCarritoDto {
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
}
