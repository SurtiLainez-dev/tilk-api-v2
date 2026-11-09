import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "gastos" })
export class Gastos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "tipo_gasto_id", type: "bigint", unsigned: true })
  tipo_gasto_id!: string;

  @Column({ name: "detalle", type: "varchar", length: 255 })
  detalle!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "file", type: "varchar", length: 255, nullable: true })
  file?: string | null;

  @Column({ name: "estado", type: "tinyint" })
  estado!: number;

  @Column({ name: "total", type: "double", precision: 9, scale: 2 })
  total!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;

  @Column({ name: "caja_chica_id", type: "bigint", unsigned: true, nullable: true })
  caja_chica_id?: string | null;

  @Column({ name: "proveedor_id", type: "bigint", unsigned: true, nullable: true })
  proveedor_id?: string | null;

  @Column({ name: "is_reembolso", type: "tinyint", default: 0 })
  is_reembolso!: number;

  @Column({ name: "ct_acreedor_id", type: "bigint", unsigned: true, nullable: true })
  ct_acreedor_id?: string | null;

  @Column({ name: "ct_libro_diario_id", type: "bigint", unsigned: true, nullable: true })
  ct_libro_diario_id?: string | null;

  @Column({ name: "correlativo", type: "varchar", length: 50, nullable: true })
  correlativo?: string | null;
}
