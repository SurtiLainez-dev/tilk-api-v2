
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'actualizacions' })
export class Actualizacions {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'text' })
    version!: string;

    @Column({ type: 'tinyint' })
    estado!: number;

    @Column({ type: 'text' })
    link_page!: string;

    @Column({ type: 'text' })
    link_binario!: string;

    @Column({ type: 'json' })
    comentarios!: unknown;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;

    @Column({ type: 'double', precision: 9, scale: 6, default: 0 })
    version_int!: number;
}
