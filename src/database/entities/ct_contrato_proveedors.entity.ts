import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ct_contrato_proveedors' })
export class CtContratoProveedors {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "tipo_gasto_id", type: "bigint", unsigned: true })
  tipo_gasto_id!: string;

  @Column({ name: "sucursal_id", type: "bigint", unsigned: true })
  sucursal_id!: string;

  @Column({ name: "ct_divisa_id", type: "bigint", unsigned: true })
  ct_divisa_id!: string;

  @Column({ name: "proveedor_id", type: "bigint", unsigned: true })
  proveedor_id!: string;

  @Column({ name: "num_contrato", type: "varchar", length: 50, nullable: true })
  num_contrato!: string | null;

  @Column({ name: "meses", type: "int" })
  meses!: number;

  @Column({ name: "mes_actual", type: "int" })
  mes_actual!: number;

  @Column({ name: "detalle", type: "text", nullable: true })
  detalle!: string | null;

  @Column({ name: "total_divisa", type: "double", precision: 11, scale: 2 })
  total_divisa!: number;

  @Column({ name: "total_contrato_divisa", type: "double", precision: 11, scale: 2 })
  total_contrato_divisa!: number;

  @Column({ name: "total_abonado_divisa", type: "double", precision: 11, scale: 2 })
  total_abonado_divisa!: number;

  @Column({ name: "saldo_actual_divisa", type: "double", precision: 11, scale: 2 })
  saldo_actual_divisa!: number;

  @Column({ name: "total", type: "double", precision: 11, scale: 2 })
  total!: number;

  @Column({ name: "total_contrato", type: "double", precision: 11, scale: 2 })
  total_contrato!: number;

  @Column({ name: "total_abonado", type: "double", precision: 11, scale: 2 })
  total_abonado!: number;

  @Column({ name: "saldo_actual", type: "double", precision: 11, scale: 2 })
  saldo_actual!: number;

  @Column({ name: "fecha_inicio", type: "date" })
  fecha_inicio!: string;

  @Column({ name: "fecha_finalizacion", type: "date" })
  fecha_finalizacion!: string;

  @Column({ name: "documentos", type: "json", nullable: true })
  documentos!: unknown | null;

  @Column({ name: "estado", type: "int", comment: "1: Al dia. 2:Vencido. 3:Cancelado" })
  estado!: number;

  @Column({ name: "formato_id", type: "bigint", unsigned: true, nullable: true })
  formato_id!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

  @Column({ name: "file", type: "varchar", length: 300, nullable: true })
  file!: string | null;

}
