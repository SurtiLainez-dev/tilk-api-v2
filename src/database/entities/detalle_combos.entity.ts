import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "detalle_combos" })
export class DetalleCombos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "combo_id", type: "bigint", unsigned: true })
  combo_id!: string;

  @Column({ name: "articulo_id", type: "bigint", unsigned: true })
  articulo_id!: string;

  @Column({ name: "precio_costo", type: "double", precision: 9, scale: 2, default: 0.00 })
  precio_costo!: number;

  @Column({ name: "precio_contado", type: "double", precision: 9, scale: 2, default: 0.00 })
  precio_contado!: number;

  @Column({ name: "precio", type: "double", precision: 9, scale: 2, default: 0.00 })
  precio!: number;

  @Column({ name: "detalle", type: "varchar", length: 255, nullable: true })
  detalle?: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
