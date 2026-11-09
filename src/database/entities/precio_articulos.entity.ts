import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'precio_articulos' })
export class PrecioArticulosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'articulo_id', type: 'bigint', unsigned: true })
  articulo_id!: string;

  @Column({ name: 'precio_costo_antiguo', type: 'double', precision: 9, scale: 2, nullable: true })
  precio_costo_antiguo!: number | null;

  @Column({ name: 'precio_costo_actual', type: 'double', precision: 9, scale: 2, nullable: true })
  precio_costo_actual!: number | null;

  @Column({ name: 'precio_contado', type: 'double', precision: 9, scale: 2, nullable: true })
  precio_contado!: number | null;

  @Column({ name: 'minimo_prima', type: 'double', precision: 9, scale: 2, nullable: true })
  minimo_prima!: number | null;

  @Column({ name: 'margen_ganancia', type: 'double', precision: 6, scale: 3, nullable: true })
  margen_ganancia!: number | null;

  @Column({ name: 'financiamiento_anual', type: 'double', precision: 6, scale: 2, nullable: true })
  financiamiento_anual!: number | null;

  @Column({ name: 'estado', type: 'tinyint' })
  estado!: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'impuesto_id', type: 'bigint', unsigned: true })
  impuesto_id!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'descuento', type: 'double', precision: 9, scale: 2 })
  descuento!: number;

  @Column({ name: 'cant_pagos_contado', type: 'int', default: 0 })
  cant_pagos_contado!: number;

  @Column({ name: 'venta_sin_prima', type: 'tinyint', default: 0 })
  venta_sin_prima!: number;

  @Column({ name: 'maximo_financiacion', type: 'int', default: 24 })
  maximo_financiacion!: number;

  @Column({ name: 'end_promocion', type: 'date', nullable: true })
  end_promocion!: string | null;

  @Column({ name: 'codigo_oferta', type: 'varchar', length: 6, nullable: true })
  codigo_oferta!: string | null;

  @Column({ name: 'precio_codigo', type: 'double', precision: 9, scale: 2, nullable: true })
  precio_codigo!: number | null;

  @Column({ name: 'fecha_fin_cant_pagos_precio_contado', type: 'date', nullable: true })
  fecha_fin_cant_pagos_precio_contado!: string | null;

  @Column({ name: 'precio_online', type: 'double', default: 0 })
  precio_online!: number;

}
