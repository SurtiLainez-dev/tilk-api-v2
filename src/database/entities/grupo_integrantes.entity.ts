import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "grupo_integrantes" })
export class GrupoIntegrantes {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "grupo_usuario_id", type: "bigint", unsigned: true })
  grupo_usuario_id!: string;

  @Column({ name: "estado", type: "tinyint", default: 1 })
  estado!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
