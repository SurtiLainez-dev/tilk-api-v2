import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuerpo_transferencias' })
export class CuerpoTransferencias {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "transferencia_articulo_id", type: "bigint", unsigned: true })
  transferencia_articulo_id!: string;

  @Column({ name: "articulo_id", type: "bigint", unsigned: true })
  articulo_id!: string;

  @Column({ name: "cantidad", type: "int" })
  cantidad!: number;

  @Column({ name: "estado_articulo", type: "varchar", length: 10 })
  estado_articulo!: string;

  @Column({ name: "is_componente", type: "tinyint" })
  is_componente!: number;

  @Column({ name: "is_remision", type: "tinyint" })
  is_remision!: number;

  @Column({ name: "remisiones", type: "json", nullable: true })
  remisiones!: unknown | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

  @Column({ name: "cantidad_recibida", type: "int", nullable: true })
  cantidad_recibida!: number | null;

}
