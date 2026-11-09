
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'admin_cobro_traspasos' })
export class AdminCobroTraspasos {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'bigint', unsigned: true })
    user_id!: string;

    @Column({ type: 'varchar', length: 100 })
    detalle!: string;

    @Column({ type: 'double', precision: 9, scale: 2 })
    cobro!: number;

    @Column({ type: 'tinyint' })
    estado!: number;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;
}
