import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_k_task_activities' })
export class TKTaskActivitiesEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  task_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  project_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  user_id?: string | null;

  @Column({ type: 'varchar', length: 255 })
  accion!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  campo?: string | null;

  @Column({ type: 'text', nullable: true })
  valor_anterior?: string | null;

  @Column({ type: 'text', nullable: true })
  valor_nuevo?: string | null;

  @Column({ type: 'text', nullable: true })
  detalle?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ip?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_agent?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
