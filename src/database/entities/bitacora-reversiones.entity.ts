import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "bitacora_reversiones" })
export class BitacoraReversiones {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "tipo", type: "varchar", length: "25", comment: "bancos, caja, etc..." })
  tipo!: string;

  @Column({ name: "referencia_id", type: "int" })
  referencia_id!: number;

  @Column({ name: "referencia", type: "varchar", length: "25" })
  referencia!: string;

  @Column({ name: "ct_libro_diario_id", type: "bigint", unsigned: true })
  ct_libro_diario_id!: string;

  @Column({ name: "ref_reversion", type: "varchar", length: "255", nullable: true })
  ref_reversion!: string | null;

  @Column({ name: "fecha_vencimiento", type: "date" })
  fecha_vencimiento!: string;

  @Column({ name: "estado", type: "tinyint" })
  estado!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;
}
