import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ct_formato_pago_proveedors' })
export class CtFormatoPagoProveedors {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "cc_acreditar_ids", type: "json", nullable: true })
  cc_acreditar_ids!: unknown | null;

  @Column({ name: "tipo_gasto_ids", type: "json" })
  tipo_gasto_ids!: unknown;

  @Column({ name: "proveedor_id", type: "bigint", unsigned: true })
  proveedor_id!: string;

  @Column({ name: "nombre", type: "varchar", length: 200 })
  nombre!: string;

  @Column({ name: "total_inicial", type: "double", precision: 11, scale: 2 })
  total_inicial!: number;

  @Column({ name: "total_actual", type: "double", precision: 11, scale: 2 })
  total_actual!: number;

  @Column({ name: "total_restante", type: "double", precision: 11, scale: 2 })
  total_restante!: number;

  @Column({ name: "detalle", type: "text", nullable: true })
  detalle!: string | null;

  @Column({ name: "is_contrato", type: "tinyint", default: 0 })
  is_contrato!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
