import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("inicio_modulos")
export class InicioModulos {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  key!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255 })
  icon!: string;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'varchar', length: 255 })
  color!: string;

  @Column({ type: 'varchar', length: 255 })
  params!: string;

  @Column({ type: 'tinyint', default: 0 })
  disable!: number;

  @Column({ type: 'tinyint', default: 0 })
  external_window!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
