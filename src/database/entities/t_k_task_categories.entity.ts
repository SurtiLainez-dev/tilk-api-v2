import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_k_task_categories' })
export class TKTaskCategoriesEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 4 })
  cod!: string;

  @Column({ type: 'text', nullable: true })
  detalle?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color?: string | null;

  @Column({ type: 'tinyint', default: 1 })
  activo!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
