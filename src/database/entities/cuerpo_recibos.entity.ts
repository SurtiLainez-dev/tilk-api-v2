import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuerpo_recibos' })
export class CuerpoRecibos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "recibo_id", type: "bigint", unsigned: true })
  recibo_id!: string;

  @Column({ name: "pagos_contrato_id", type: "bigint", unsigned: true })
  pagos_contrato_id!: string;

  @Column({ name: "tipo", type: "int" })
  tipo!: number;

  @Column({ name: "detalle", type: "varchar", length: 50 })
  detalle!: string;

  @Column({ name: "total_capital", type: "double", precision: 9, scale: 2, nullable: true })
  total_capital!: number | null;

  @Column({ name: "total_interes", type: "double", precision: 9, scale: 2, nullable: true })
  total_interes!: number | null;

  @Column({ name: "total_mora", type: "double", precision: 9, scale: 2, nullable: true })
  total_mora!: number | null;

  @Column({ name: "total", type: "double", precision: 9, scale: 2, nullable: true })
  total!: number | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
