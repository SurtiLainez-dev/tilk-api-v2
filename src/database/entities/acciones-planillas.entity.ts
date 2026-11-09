
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'acciones_planillas' })
export class AccionesPlanillas {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'bigint', unsigned: true })
    cuerpo_planilla_id!: string;

    @Column({ type: 'bigint', unsigned: true })
    tipo_acciones_planilla_id!: string;

    @Column({ type: 'double', precision: 9, scale: 2 })
    total!: number;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;
}
