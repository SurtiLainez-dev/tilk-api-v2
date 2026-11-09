import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_k_task_priorities' })
export class TKTaskPrioritiesEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 30 })
  cod!: string;

  @Column({ type: 'text', nullable: true })
  detalle?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color?: string | null;

  @Column({ type: 'int', default: 0 })
  orden!: number;

  @Column({ type: 'tinyint', default: 1 })
  activo!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
