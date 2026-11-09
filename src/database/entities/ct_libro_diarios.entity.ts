import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ct_libro_diarios' })
export class CtLibroDiarios {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "detalle", type: "varchar", length: 200 })
  detalle!: string;

  @Column({ name: "fecha", type: "date" })
  fecha!: string;

  @Column({ name: "hora", type: "time" })
  hora!: string;

  @Column({ name: "referencia", type: "varchar", length: 30 })
  referencia!: string;

  @Column({ name: "folio", type: "varchar", length: 15, nullable: true })
  folio!: string | null;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "file_generado", type: "varchar", length: 255, nullable: true })
  file_generado!: string | null;

  @Column({ name: "file_subido", type: "varchar", length: 255, nullable: true })
  file_subido!: string | null;

  @Column({ name: "credito", type: "double", precision: 9, scale: 2 })
  credito!: number;

  @Column({ name: "debitp", type: "double", precision: 9, scale: 2 })
  debitp!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

  @Column({ name: "anio", type: "int", nullable: true })
  anio!: number | null;

  @Column({ name: "mes", type: "int", nullable: true })
  mes!: number | null;

}
