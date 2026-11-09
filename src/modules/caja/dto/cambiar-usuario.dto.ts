
import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';

export class CambiarUsuarioDto {
    @ApiProperty({
        example: '45',
        description: 'ID del nuevo usuario asignado a la Caja',
    })
    @IsNumberString()
    user_id!: string;
}
