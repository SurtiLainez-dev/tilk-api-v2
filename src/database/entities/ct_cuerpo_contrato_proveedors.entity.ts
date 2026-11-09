import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ct_cuerpo_contrato_proveedors' })
export class CtCuerpoContratoProveedors {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "ct_contrato_proveedor_id", type: "bigint", unsigned: true })
  ct_contrato_proveedor_id!: string;

  @Column({ name: "detalle", type: "varchar", length: 100 })
  detalle!: string;

  @Column({ name: "saldo_inicial", type: "double", precision: 11, scale: 2 })
  saldo_inicial!: number;

  @Column({ name: "saldo_abonado", type: "double", precision: 11, scale: 2 })
  saldo_abonado!: number;

  @Column({ name: "saldo_actual", type: "double", precision: 11, scale: 2 })
  saldo_actual!: number;

  @Column({ name: "documento_escaneado", type: "text", nullable: true })
  documento_escaneado!: string | null;

  @Column({ name: "estado", type: "tinyint" })
  estado!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
