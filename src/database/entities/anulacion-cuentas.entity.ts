
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'anulacion_cuentas' })
export class AnulacionCuentas {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'bigint', unsigned: true })
    user_id!: string;

    @Column({ type: 'bigint', unsigned: true })
    venta_id!: string;

    @Column({ type: 'text' })
    observacion!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    file!: string | null;

    @Column({ type: 'json', nullable: true })
    fotos!: unknown | null;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;
}
