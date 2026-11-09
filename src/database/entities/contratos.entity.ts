import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'contratos' })
export class Contratos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "fecha_inicio", type: "date" })
  fecha_inicio!: string;

  @Column({ name: "fecha_final", type: "date" })
  fecha_final!: string;

  @Column({ name: "estado", type: "tinyint" })
  estado!: number;

  @Column({ name: "observacion", type: "varchar", length: 200, nullable: true })
  observacion!: string | null;

  @Column({ name: "pago", type: "double", precision: 8, scale: 2 })
  pago!: number;

  @Column({ name: "colaborador_id", type: "bigint", unsigned: true })
  colaborador_id!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
