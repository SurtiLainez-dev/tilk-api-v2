
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type TipoPagoAjuste = 'PAGO' | 'MORA';
export type NaturalezaAjuste = 'DEBITO' | 'CREDITO';

@Entity({ name: 'ajuste_movimientos' })
export class AjusteMovimientos {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'bigint', unsigned: true })
    ajuste_venta_id!: string;

    @Column({ type: 'bigint', unsigned: true, nullable: true })
    pago_contrato_id!: string | null;

    @Column({ type: 'enum', enum: ['PAGO', 'MORA'] })
    tipo_pago!: TipoPagoAjuste;

    @Column({ type: 'decimal', precision: 9, scale: 2 })
    total!: string;

    @Column({ type: 'enum', enum: ['DEBITO', 'CREDITO'] })
    naturaleza!: NaturalezaAjuste;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;
}
