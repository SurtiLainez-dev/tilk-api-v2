import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "directrices__impresions" })
export class DirectricesImpresions {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "sucursal_id", type: "bigint", unsigned: true })
  sucursal_id!: string;

  @Column({ name: "contador_inicial", type: "varchar", length: 8 })
  contador_inicial!: string;

  @Column({ name: "contador_final", type: "varchar", length: 8 })
  contador_final!: string;

  @Column({ name: "codigo_post_contador", type: "varchar", length: 11 })
  codigo_post_contador!: string;

  @Column({ name: "fecha_emision", type: "date", nullable: true })
  fecha_emision?: Date | null;

  @Column({ name: "fecha_final", type: "date", nullable: true })
  fecha_final?: Date | null;

  @Column({ name: "estado", type: "tinyint" })
  estado!: number;

  @Column({ name: "cai", type: "varchar", length: 40, nullable: true })
  cai?: string | null;

  @Column({ name: "tipo", type: "int" })
  tipo!: number;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "inicio_contador", type: "varchar", length: 8 })
  inicio_contador!: string;

  @Column({ name: "contador_actual", type: "varchar", length: 8 })
  contador_actual!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;

  @Column({ name: "observacion", type: "varchar", length: 20, nullable: true, default: "carta" })
  observacion?: string | null;
}
