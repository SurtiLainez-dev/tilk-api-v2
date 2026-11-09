import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "finiquitos" })
export class Finiquitos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "cliente_id", type: "bigint", unsigned: true })
  cliente_id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true, nullable: true })
  user_id?: string | null;

  @Column({ name: "estado", type: "enum", enum: ["PENDIENTE", "ACEPTADO", "RECHAZADO", "VENCIDO"], default: "PENDIENTE" })
  estado!: "PENDIENTE" | "ACEPTADO" | "RECHAZADO" | "VENCIDO";

  @Column({ name: "comentario_user", type: "varchar", length: 255, nullable: true })
  comentario_user?: string | null;

  @Column({ name: "is_mencion", type: "tinyint", default: 0 })
  is_mencion!: number;

  @Column({ name: "para", type: "varchar", length: 255, nullable: true })
  para?: string | null;

  @Column({ name: "cod", type: "varchar", length: 15 })
  cod!: string;

  @Column({ name: "conducta_pago", type: "varchar", length: 200, nullable: true })
  conducta_pago?: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
