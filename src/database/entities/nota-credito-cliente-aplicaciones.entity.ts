import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotaCreditoTipoAplicacion {
    VENTA_CONTADO = 'VENTA_CONTADO',
    ABONO_CUENTA = 'ABONO_CUENTA',
    PAGO_DXC = 'PAGO_DXC',
}

@Entity({
    name: 'nota_credito_cliente_aplicaciones',
})
@Index('uq_ncca_slug', ['slug'], { unique: true })
@Index(
    'uq_ncca_operacion_nota',
    ['operacion_uuid', 'nota_credito_cliente_id'],
    { unique: true },
)
@Index('idx_ncca_nota_estado', [
    'nota_credito_cliente_id',
    'estado',
])
@Index('idx_ncca_venta', ['venta_id'])
@Index('idx_ncca_recibo', ['recibo_id'])
@Index('idx_ncca_caja_fecha', [
    'caja_id',
    'created_at',
])
@Index('idx_ncca_usuario', ['user_id'])
@Index('idx_ncca_tipo', ['tipo_aplicacion'])
export class NotaCreditoClienteAplicaciones {

    @PrimaryGeneratedColumn({
        name: 'id',
        type: 'bigint',
        unsigned: true,
    })
    id!: string;

    @Column({
        name: 'slug',
        type: 'char',
        length: 36,
    })
    slug!: string;

    @Column({
        name: 'nota_credito_cliente_id',
        type: 'bigint',
        unsigned: true,
    })
    nota_credito_cliente_id!: string;

    @Column({
        name: 'venta_id',
        type: 'bigint',
        unsigned: true,
        nullable: true,
        default: null,
    })
    venta_id!: string | null;

    @Column({
        name: 'recibo_id',
        type: 'bigint',
        unsigned: true,
        nullable: true,
        default: null,
    })
    recibo_id!: string | null;

    @Column({
        name: 'caja_id',
        type: 'bigint',
        unsigned: true,
        nullable: true,
        default: null,
    })
    caja_id!: string | null;

    @Column({
        name: 'user_id',
        type: 'bigint',
        unsigned: true,
    })
    user_id!: string;

    @Column({
        name: 'tipo_aplicacion',
        type: 'enum',
        enum: NotaCreditoTipoAplicacion,
    })
    tipo_aplicacion!: NotaCreditoTipoAplicacion;

    @Column({
        name: 'monto',
        type: 'decimal',
        precision: 14,
        scale: 2,
    })
    monto!: string;

    @Column({
        name: 'saldo_anterior',
        type: 'decimal',
        precision: 14,
        scale: 2,
    })
    saldo_anterior!: string;

    @Column({
        name: 'saldo_nuevo',
        type: 'decimal',
        precision: 14,
        scale: 2,
    })
    saldo_nuevo!: string;

    @Column({
        name: 'operacion_uuid',
        type: 'char',
        length: 36,
    })
    operacion_uuid!: string;

    @Column({
        name: 'concepto',
        type: 'varchar',
        length: 250,
    })
    concepto!: string;

    @Column({
        name: 'estado',
        type: 'tinyint',
        unsigned: true,
        default: 1,
    })
    estado!: number;

    @Column({
        name: 'fecha_anulacion',
        type: 'datetime',
        nullable: true,
        default: null,
    })
    fecha_anulacion!: Date | null;

    @Column({
        name: 'user_anulacion_id',
        type: 'bigint',
        unsigned: true,
        nullable: true,
        default: null,
    })
    user_anulacion_id!: string | null;

    @Column({
        name: 'motivo_anulacion',
        type: 'varchar',
        length: 400,
        nullable: true,
        default: null,
    })
    motivo_anulacion!: string | null;

    @Column({
        name: 'created_at',
        type: 'timestamp',
        nullable: true,
        default: null,
    })
    created_at!: Date | null;

    @Column({
        name: 'updated_at',
        type: 'timestamp',
        nullable: true,
        default: null,
    })
    updated_at!: Date | null;
}