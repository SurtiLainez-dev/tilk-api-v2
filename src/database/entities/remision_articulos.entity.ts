import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'remision_articulos' })
export class RemisionArticulosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'estado_articulo_id', type: 'bigint', unsigned: true })
  estado_articulo_id!: string;

  @Column({ name: 'precio_inicial', type: 'double', precision: 9, scale: 2, nullable: true })
  precio_inicial!: number | null;

  @Column({ name: 'precio_actual', type: 'double', precision: 9, scale: 2, nullable: true })
  precio_actual!: number | null;

  @Column({ name: 'serie_sistema', type: 'varchar', length: 20 })
  serie_sistema!: string;

  @Column({ name: 'serie_fabricante', type: 'varchar', length: 100, nullable: true })
  serie_fabricante!: string | null;

  @Column({ name: 'sucursal_id', type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ name: 'articulo_id', type: 'bigint', unsigned: true })
  articulo_id!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'color', type: 'varchar', length: 50, nullable: true })
  color!: string | null;

  @Column({ name: 'margen_anual', type: 'varchar', length: 255, nullable: true })
  margen_anual!: string | null;

  @Column({ name: 'comentarios', type: 'json', nullable: true })
  comentarios!: Record<string, unknown> | unknown[] | null;

}
