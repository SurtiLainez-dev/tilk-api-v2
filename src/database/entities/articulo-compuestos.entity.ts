
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'articulo_compuestos' })
export class ArticuloCompuestos {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'varchar', length: 60 })
    detalle!: string;

    @Column({ type: 'int' })
    cantidad!: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    detalle_cantidad!: string | null;

    @Column({ type: 'varchar', length: 22 })
    codigo!: string;

    @Column({ type: 'bigint', unsigned: true })
    articulo_id!: string;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;
}
