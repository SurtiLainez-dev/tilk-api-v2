import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "colaboradors" })
export class Colaboradors {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "nombres", type: "varchar", length: "50" })
  nombres!: string;

  @Column({ name: "apellidos", type: "varchar", length: "50" })
  apellidos!: string;

  @Column({ name: "email", type: "varchar", length: "50", nullable: true })
  email!: string | null;

  @Column({ name: "telefono", type: "varchar", length: "8", nullable: true })
  telefono!: string | null;

  @Column({ name: "estado", type: "tinyint" })
  estado!: number;

  @Column({ name: "puesto_colaborador_id", type: "bigint", unsigned: true })
  puesto_colaborador_id!: string;

  @Column({ name: "sucursal_id", type: "bigint", unsigned: true })
  sucursal_id!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;

  @Column({ name: "identidad", type: "varchar", length: "13", nullable: true })
  identidad!: string | null;

  @Column({ name: "foto_perfil", type: "varchar", length: "150", nullable: true })
  foto_perfil!: string | null;

  @Column({ name: "codigo", type: "varchar", length: "7", nullable: true })
  codigo!: string | null;
}
