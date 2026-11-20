
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export type EstadoOperacionPago =
    | 'PENDIENTE'
    | 'PROCESANDO'
    | 'COMPLETADO'
    | 'ERROR'
    | 'CERRADO';

@Entity({ name: 'caja_operaciones_pago' })
@Index('uq_caja_operacion_uuid', ['operacion_id'], {
    unique: true,
})
@Index('uq_caja_operacion_recibo', ['recibo_id'], {
    unique: true,
})
@Index('idx_caja_operacion_venta', ['venta_id'])
@Index('idx_caja_operacion_caja', ['caja_id'])
@Index('idx_caja_operacion_usuario', ['user_id'])
@Index('idx_caja_operacion_estado', ['estado', 'created_at'])
export class CajaOperacionPago {

    @PrimaryGeneratedColumn({
        type: 'bigint',
        unsigned: true,
    })
    id!: string;

    @Column({
        type: 'varchar',
        length: 36,
    })
    operacion_id!: string;

    @Column({
        type: 'bigint',
        unsigned: true,
    })
    venta_id!: string;

    @Column({
        type: 'bigint',
        unsigned: true,
    })
    caja_id!: string;

    @Column({
        type: 'bigint',
        unsigned: true,
    })
    user_id!: string;

    @Column({
        type: 'bigint',
        unsigned: true,
        nullable: true,
    })
    recibo_id!: string | null;

    @Column({
        type: 'decimal',
        precision: 15,
        scale: 2,
    })
    monto!: string;

    @Column({
        type: 'varchar',
        length: 30,
        default: 'PENDIENTE',
    })
    estado!: EstadoOperacionPago;

    @Column({
        type: 'char',
        length: 64,
        nullable: true,
    })
    request_hash!: string | null;

    @Column({
        type: 'longtext',
        nullable: true,
    })
    respuesta!: string | null;

    @Column({
        type: 'text',
        nullable: true,
    })
    error!: string | null;

    @CreateDateColumn({
        type: 'datetime',
    })
    created_at!: Date;

    @UpdateDateColumn({
        type: 'datetime',
    })
    updated_at!: Date;
}
