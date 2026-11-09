import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "ccs" })
export class Ccs {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "cod", type: "varchar", length: "60" })
  cod!: string;

  @Column({ name: "cod_dep", type: "varchar", length: "60" })
  cod_dep!: string;

  @Column({ name: "nombre", type: "varchar", length: "250" })
  nombre!: string;

  @Column({ name: "ferencia_tabla", type: "varchar", length: "50", nullable: true })
  ferencia_tabla!: string | null;

  @Column({ name: "referencia_id", type: "int", nullable: true })
  referencia_id!: number | null;

  @Column({ name: "registros", type: "json", nullable: true })
  registros!: unknown | null;

  @Column({ name: "total", type: "double", precision: 20, scale: 2, nullable: true })
  total!: number | null;

  @Column({ name: "comentario", type: "varchar", length: "250", nullable: true })
  comentario!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;
}
