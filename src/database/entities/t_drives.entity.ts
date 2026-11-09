import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 't_drives' })
export class TDrivesEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'dir', type: 'varchar', length: 500 })
  dir!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 500 })
  nombre!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'estado', type: 'enum', enum: ['PUBLIC', 'PRIVATE'], default: "PRIVATE" })
  estado!: string;

  @Column({ name: 'usuarios_visibles', type: 'json', nullable: true })
  usuarios_visibles!: Record<string, unknown> | unknown[] | null;

  @Column({ name: 'si_file', type: 'tinyint', default: 1 })
  si_file!: number;

  @Column({ name: 'usuarios_compartidos', type: 'json', nullable: true })
  usuarios_compartidos!: Record<string, unknown> | unknown[] | null;

  @Column({ name: 'dir_padre', type: 'bigint', unsigned: true, nullable: true })
  dir_padre!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
