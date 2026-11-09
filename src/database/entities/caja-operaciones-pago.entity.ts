
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'

export type EstadoOperacionPago =
    | 'PROCESANDO'
    | 'COMPLETADO'

@Entity({ name: 'caja_operaciones_pago' })
@Index('uq_caja_operacion_uuid', ['operacion_id'], { unique: true })
@Index('uq_caja_operacion_recibo', ['recibo_id'], { unique: true })
@Index('idx_caja_operacion_venta', ['venta_id'])
@Index('idx_caja_operacion_caja', ['caja_id'])
@Index('idx_caja_operacion_usuario', ['user_id'])
@Index('idx_caja_operacion_estado', ['estado', 'created_at'])
export class CajaOperacionPago {
    @PrimaryGeneratedColumn({
        type: 'bigint',
        unsigned: true,
    })
    id!: string

    @Column({
        type: 'char',
        length: 36,
    })
    operacion_id!: string

    @Column({
        type: 'bigint',
        unsigned: true,
    })
    venta_id!: string

    @Column({
        type: 'bigint',
        unsigned: true,
    })
    caja_id!: string

    @Column({
        type: 'bigint',
        unsigned: true,
    })
    user_id!: string

    @Column({
        type: 'bigint',
        unsigned: true,
        nullable: true,
    })
    recibo_id!: string | null

    @Column({
        type: 'decimal',
        precision: 14,
        scale: 2,
    })
    monto!: string

    @Column({
        type: 'enum',
        enum: ['PROCESANDO', 'COMPLETADO'],
        default: 'PROCESANDO',
    })
    estado!: EstadoOperacionPago

    @Column({
        type: 'char',
        length: 64,
    })
    request_hash!: string

    @Column({
        type: 'json',
        nullable: true,
    })
    respuesta!: Record<string, unknown> | null

    @CreateDateColumn({
        type: 'timestamp',
        precision: 6,
    })
    created_at!: Date

    @UpdateDateColumn({
        type: 'timestamp',
        precision: 6,
    })
    updated_at!: Date
}
