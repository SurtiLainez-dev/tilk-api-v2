import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ct_partidas' })
export class CtPartidas {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "tipo", type: "tinyint", comment: "0: credito, 1:debito" })
  tipo!: number;

  @Column({ name: "detalle", type: "varchar", length: 255 })
  detalle!: string;

  @Column({ name: "ct_libro_diario_id", type: "bigint", unsigned: true })
  ct_libro_diario_id!: string;

  @Column({ name: "transaccion", type: "bigint", unsigned: true })
  transaccion!: string;

  @Column({ name: "cc_id", type: "bigint", unsigned: true })
  cc_id!: string;

  @Column({ name: "total", type: "double", precision: 9, scale: 2 })
  total!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

  @Column({ name: "tarea", type: "tinyint", nullable: true })
  tarea!: number | null;

}
