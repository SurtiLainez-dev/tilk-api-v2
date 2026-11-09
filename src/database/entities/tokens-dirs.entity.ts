import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tokens_dirs' })
export class TokensDirsEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'dir_id', type: 'bigint', unsigned: true })
  dir_id!: string;

  @Column({ name: 'agent_id', type: 'bigint', unsigned: true })
  agent_id!: string;

  @Column({ name: 'token', type: 'varchar', length: 255 })
  token!: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expires_at!: Date;

  @Column({ name: 'lat', type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat!: string | null;

  @Column({ name: 'lon', type: 'decimal', precision: 10, scale: 7, nullable: true })
  lon!: string | null;

  @Column({ name: 'used_at', type: 'tinyint', default: 0 })
  used_at!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'estado', type: 'tinyint', default: 1 })
  estado!: number;

  @Column({ name: 'etiqueta', type: 'varchar', length: 255, default: '-' })
  etiqueta!: string;

}
