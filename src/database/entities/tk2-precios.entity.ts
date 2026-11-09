import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tk2_precios' })
export class Tk2PreciosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'articulo_id', type: 'bigint', unsigned: true })
  articulo_id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true })
  user_id!: string | null;

  @Column({ name: 'impuesto_id', type: 'bigint', unsigned: true, nullable: true })
  impuesto_id!: string | null;

  @Column({ name: 'precio_costo', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  precio_costo!: string;

  @Column({ name: 'costos_administrativos', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  costos_administrativos!: string;

  @Column({ name: 'precio_gravado', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  precio_gravado!: string;

  @Column({ name: 'procentaje_ganancia', type: 'decimal', precision: 6, scale: 2, default: 0.00 })
  procentaje_ganancia!: string;

  @Column({ name: 'ganancia', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  ganancia!: string;

  @Column({ name: 'precio_contado', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  precio_contado!: string;

  @Column({ name: 'precio_online', type: 'decimal', precision: 12, scale: 2, nullable: true })
  precio_online!: string | null;

  @Column({ name: 'procentaje_descuento', type: 'decimal', precision: 6, scale: 2, nullable: true })
  procentaje_descuento!: string | null;

  @Column({ name: 'maximo_descuento', type: 'decimal', precision: 12, scale: 2, nullable: true })
  maximo_descuento!: string | null;

  @Column({ name: 'estado', type: 'tinyint', default: 1 })
  estado!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
