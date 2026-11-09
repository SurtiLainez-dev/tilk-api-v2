import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'contrasenas' })
export class Contrasenas {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "proveedor", type: "varchar", length: 80 })
  proveedor!: string;

  @Column({ name: "usuario", type: "varchar", length: 50 })
  usuario!: string;

  @Column({ name: "colaborador_id", type: "bigint", unsigned: true })
  colaborador_id!: string;

  @Column({ name: "contrasena", type: "varchar", length: 70 })
  contrasena!: string;

  @Column({ name: "observacion", type: "varchar", length: 100, nullable: true })
  observacion!: string | null;

  @Column({ name: "estado", type: "tinyint" })
  estado!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
