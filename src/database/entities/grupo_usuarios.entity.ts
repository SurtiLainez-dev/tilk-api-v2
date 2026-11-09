import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "grupo_usuarios" })
export class GrupoUsuarios {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: 255 })
  nombre!: string;

  @Column({ name: "descripcion", type: "varchar", length: 400 })
  descripcion!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
