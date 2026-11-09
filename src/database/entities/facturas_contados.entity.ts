import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "facturas_contados" })
export class FacturasContados {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "venta_id", type: "bigint", unsigned: true })
  venta_id!: string;

  @Column({ name: "articulo_id", type: "bigint", unsigned: true })
  articulo_id!: string;

  @Column({ name: "cantidad", type: "int" })
  cantidad!: number;

  @Column({ name: "precio", type: "double", precision: 9, scale: 2 })
  precio!: number;

  @Column({ name: "total", type: "double", precision: 9, scale: 2 })
  total!: number;

  @Column({ name: "remision_articulo_id", type: "bigint", unsigned: true, nullable: true })
  remision_articulo_id?: string | null;

  @Column({ name: "is_remision", type: "tinyint" })
  is_remision!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;

  @Column({ name: "estado_articulo_id", type: "bigint", unsigned: true, nullable: true })
  estado_articulo_id?: string | null;

  @Column({ name: "combo_id", type: "bigint", unsigned: true, nullable: true })
  combo_id?: string | null;
}
