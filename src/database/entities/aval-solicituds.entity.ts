
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'aval_solicituds' })
export class AvalSolicituds {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'bigint', unsigned: true })
    cliente_id!: string;

    @Column({ type: 'bigint', unsigned: true })
    solicitud_credito_id!: string;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;

    @Column({ type: 'tinyint', nullable: true, default: 1 })
    estado!: number | null;

    @Column({ type: 'varchar', length: 250, nullable: true })
    documento!: string | null;
}
