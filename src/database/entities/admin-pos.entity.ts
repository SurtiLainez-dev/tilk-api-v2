
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'admin_pos' })
export class AdminPos {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'bigint', unsigned: true })
    cuenta_banco_id!: string;

    @Column({ type: 'bigint', unsigned: true })
    cc_id!: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    detalle!: string | null;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;

    @Column({
        type: 'double',
        precision: 6,
        scale: 4,
        nullable: true,
        default: 0,
    })
    comision!: number | null;
}
