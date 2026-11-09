
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'articulos' })
export class Articulos {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    modelo!: string | null;

    @Column({ type: 'varchar', length: 80, nullable: true })
    referencia_fabricante!: string | null;

    @Column({ type: 'varchar', length: 80, nullable: true })
    codigo_barras!: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    codigo_proveedor!: string | null;

    @Column({ type: 'varchar', length: 50 })
    nombre_articulo!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    descripcion_corta!: string | null;

    @Column({ type: 'bigint', unsigned: true })
    sub_familia_articulo_id!: string;

    @Column({ type: 'varchar', length: 15 })
    codigo_sistema!: string;

    @Column({ type: 'varchar', length: 180, nullable: true })
    slug!: string | null;

    @Column({ type: 'bigint', unsigned: true })
    user_id!: string;

    @Column({ type: 'tinyint' })
    is_compuesto!: number;

    @Column({ type: 'tinyint' })
    is_motocicleta!: number;

    @Column({ type: 'bigint', unsigned: true })
    marca_id!: string;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;

    @Column({ type: 'double', nullable: true })
    precio_costo!: number | null;

    @Column({ type: 'int', nullable: true })
    stock_maximo!: number | null;

    @Column({ type: 'int', nullable: true })
    stock_minimo!: number | null;

    @Column({ type: 'tinyint', default: 0 })
    is_online!: number;

    @Column({ type: 'json', nullable: true })
    colores!: unknown | null;
}
