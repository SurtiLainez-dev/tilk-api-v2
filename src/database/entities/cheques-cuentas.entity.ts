import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "cheques_cuentas" })
export class ChequesCuentas {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "cuenta_banco_id", type: "bigint", unsigned: true })
  cuenta_banco_id!: string;

  @Column({ name: "numeracion", type: "varchar", length: "25" })
  numeracion!: string;

  @Column({ name: "estado", type: "int", comment: "1: disponible, 2: usado, 3: nulo" })
  estado!: number;

  @Column({ name: "detalle", type: "varchar", length: "255", nullable: true })
  detalle!: string | null;

  @Column({ name: "total", type: "double", precision: 9, scale: 2, nullable: true })
  total!: number | null;

  @Column({ name: "contador", type: "int" })
  contador!: number;

  @Column({ name: "partida_id", type: "bigint", unsigned: true, nullable: true })
  partida_id!: string | null;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "observacion", type: "varchar", length: "255", nullable: true })
  observacion!: string | null;

  @Column({ name: "fecha_uso", type: "date", nullable: true })
  fecha_uso!: string | null;

  @Column({ name: "hora_uso", type: "time", nullable: true })
  hora_uso!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;

  @Column({ name: "file", type: "varchar", length: "255", nullable: true })
  file!: string | null;
}
