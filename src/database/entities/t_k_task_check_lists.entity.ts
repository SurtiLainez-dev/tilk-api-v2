import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_k_task_check_lists' })
export class TKTaskCheckListsEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  task_id!: string;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'int', default: 0 })
  orden!: number;

  @Column({ type: 'tinyint', default: 0 })
  completado!: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  completado_por_user_id?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completado_at?: Date | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: '0.00' })
  peso_porcentaje!: string;

  @Column({ type: 'tinyint', default: 1 })
  activo!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
