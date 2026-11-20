import { IsString, IsNotEmpty, IsIn, IsUUID, Matches, MaxLength } from 'class-validator';

export class CrearAnticipoDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    cliente_slug!: string;

    @IsString()
    @Matches(/^\d{1,7}(\.\d{1,2})?$/, {
        message: 'El monto debe contener como máximo dos decimales.',
    })
    monto!: string;

    @IsString()
    @IsIn(['GENERAL', 'PAGO_DXC'])
    uso!: 'GENERAL' | 'PAGO_DXC';

    @IsString()
    @Matches(/^[1-9]\d*$/)
    forma_pago_id!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    observacion!: string;

    @IsUUID('4')
    operacion_uuid!: string;
}