import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ct_divisas' })
export class CtDivisas {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: 255 })
  nombre!: string;

  @Column({ name: "abre", type: "varchar", length: 255 })
  abre!: string;

  @Column({ name: "simbolo", type: "varchar", length: 255 })
  simbolo!: string;

  @Column({ name: "actual_sistema", type: "tinyint" })
  actual_sistema!: number;

  @Column({ name: "cambio", type: "double", precision: 9, scale: 2 })
  cambio!: number;

  @Column({ name: "fecha_actualizado", type: "date" })
  fecha_actualizado!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
