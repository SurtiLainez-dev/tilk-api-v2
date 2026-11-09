
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'anticipo_clientes' })
export class AnticipoClientes {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'char', length: 36, nullable: true })
    slug!: string | null;

    @Column({ type: 'bigint', unsigned: true })
    cliente_id!: string;

    @Column({ type: 'bigint', unsigned: true })
    cc_id!: string;

    @Column({ type: 'varchar', length: 400 })
    motivo!: string;

    @Column({ type: 'double', precision: 9, scale: 2 })
    monto!: number;

    @Column({ type: 'tinyint' })
    estado!: number;

    @Column({ type: 'varchar', length: 250, nullable: true })
    archivo!: string | null;

    @Column({ type: 'bigint', unsigned: true })
    recibo_id!: string;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;
}
