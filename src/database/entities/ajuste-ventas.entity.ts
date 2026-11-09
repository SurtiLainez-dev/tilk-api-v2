
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type MotivoAjusteVenta =
    | 'POS_NO_PROCESADO'
    | 'AJUSTE_MANUAL'
    | 'ERROR_CAJERO'
    | 'DEPOSITO_NO_PROCESADO'
    | 'PAGO_PLANILLA'
    | 'OTRO'
    | 'REVERSION_BANCO';

export type TipoAjusteVenta =
    | 'NOTA_DEBITO'
    | 'NOTA_CREDITO'
    | 'DEDUCCION_MANUAL'
    | 'ANULACION_FACTURA_CONTADO';

@Entity({ name: 'ajuste_ventas' })
export class AjusteVentas {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'varchar', length: 15 })
    cod!: string;

    @Column({ type: 'bigint', unsigned: true, nullable: true })
    factura_id!: string | null;

    @Column({ type: 'bigint', unsigned: true, nullable: true })
    recibo_id!: string | null;

    @Column({ type: 'bigint', unsigned: true, nullable: true })
    anticipo_cliente_id!: string | null;

    @Column({ type: 'bigint', unsigned: true, nullable: true })
    venta_id!: string | null;

    @Column({ type: 'bigint', unsigned: true, nullable: true })
    planilla_id!: string | null;

    @Column({
        type: 'enum',
        enum: [
            'POS_NO_PROCESADO',
            'AJUSTE_MANUAL',
            'ERROR_CAJERO',
            'DEPOSITO_NO_PROCESADO',
            'PAGO_PLANILLA',
            'OTRO',
            'REVERSION_BANCO',
        ],
    })
    motivo!: MotivoAjusteVenta;

    @Column({
        type: 'enum',
        enum: [
            'NOTA_DEBITO',
            'NOTA_CREDITO',
            'DEDUCCION_MANUAL',
            'ANULACION_FACTURA_CONTADO',
        ],
    })
    tipo!: TipoAjusteVenta;

    @Column({ type: 'varchar', length: 800 })
    descripcion_motivo!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    ref_pago!: string | null;

    @Column({ type: 'tinyint', default: 1 })
    reversion!: number;

    @Column({ type: 'bigint', unsigned: true })
    user_id!: string;

    @Column({ type: 'decimal', precision: 9, scale: 2 })
    total!: string;

    @Column({ type: 'tinyint', default: 1 })
    estado!: number;

    @Column({ type: 'tinyint', default: 0 })
    is_transferencia_saldos!: number;

    @Column({ type: 'tinyint', default: 0 })
    is_anulacion_factura!: number;

    @Column({ type: 'tinyint', default: 0 })
    is_planilla!: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    file!: string | null;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;
}
