import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("mob_modelos")
export class MobModelos {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  mob_marca_id!: string;

  @Column({ type: 'json' })
  ficha_tecnica!: unknown;

  @Column({ type: 'tinyint' })
  is_componentes!: number;

  @Column({ type: 'json', nullable: true })
  componentes?: unknown | null;

  @Column({ type: 'bigint', unsigned: true })
  mob_familia_id!: string;

  @Column({ type: 'varchar', length: 50 })
  sub_f!: string;

  @Column({ type: 'varchar', length: 50 })
  nombre!: string;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

  @Column({ type: 'int' })
  stock!: number;

}
