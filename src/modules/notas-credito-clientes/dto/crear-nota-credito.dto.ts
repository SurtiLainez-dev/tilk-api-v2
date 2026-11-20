import {
    IsString,
    IsOptional,
    IsEnum,
    IsUUID,
    IsDateString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

import {
    NotaCreditoModalidad,
    NotaCreditoUso,
} from '../../../database/entities/index.js';

export class CrearNotaCreditoDto {

    @IsString()
    @MinLength(1)
    @MaxLength(255)
    cliente_slug!: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    venta_slug?: string;

    @IsEnum(NotaCreditoModalidad)
    modalidad!: NotaCreditoModalidad;

    @IsOptional()
    @IsEnum(NotaCreditoUso)
    uso?: NotaCreditoUso;

    @IsString()
    @MinLength(1)
    @MaxLength(255)
    tipo_nota_credito_codigo!: string;

    @IsString()
    @Matches(/^\d{1,7}(\.\d{1,2})?$/)
    monto!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(150)
    concepto!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(400)
    motivo!: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    referencia?: string;

    @IsOptional()
    @IsDateString({ strict: true })
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    fecha_vencimiento?: string;

    @IsUUID('4')
    operacion_uuid!: string;
}