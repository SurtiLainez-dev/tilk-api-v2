
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'avales_ventas' })
export class AvalesVentas {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'bigint', unsigned: true })
    cliente_id!: string;

    @Column({ type: 'bigint', unsigned: true })
    venta_id!: string;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;
}
