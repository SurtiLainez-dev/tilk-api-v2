import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_k_tasks' })
export class TKTasksEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'char', length: 36 })
  uuid!: string;

  @Column({ type: 'varchar', length: 255 })
  cod!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  project_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  auditor_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  created_by_user_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  assigned_to_user_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true, comment: "usuario que solicito la tarea" })
  requested_by_user_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  closed_by_user_id?: string | null;

  @Column({ type: 'bigint', unsigned: true })
  t_k_task_type_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  t_k_task_category_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  t_k_task_status_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  t_k_task_priority_id!: string;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'text', nullable: true })
  detalle?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  fecha_inicio?: Date | null;

  @Column({ type: 'date', nullable: true })
  fecha_limite?: Date | null;

  @Column({ type: 'date', nullable: true })
  fecha_resolucion?: Date | null;

  @Column({ type: 'date', nullable: true })
  fecha_cierre?: Date | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: '0.00' })
  porcentaje_avance!: string;

  @Column({ type: 'int', default: 0 })
  hora_estimada_min!: number;

  @Column({ type: 'int', default: 0 })
  hora_real_min!: number;

  @Column({ type: 'tinyint', default: 0 })
  es_ticket!: number;

  @Column({ type: 'tinyint', default: 0 })
  es_recordatorio!: number;

  @Column({ type: 'tinyint', default: 0 })
  es_recurrente!: number;

  @Column({ type: 'tinyint', default: 0 })
  es_checklist!: number;

  @Column({ type: 'tinyint', default: 0 })
  es_privada!: number;

  @Column({ type: 'tinyint', default: 0 })
  es_plantilla!: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  template_task_id?: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_programada?: Date | null;

  @Column({ type: 'tinyint', default: 0 })
  es_instancia_recurrente!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  relacion_tabla?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  relacion_id?: string | null;

  @Column({ type: 'text', nullable: true })
  comentario_cierre?: string | null;

  @Column({ type: 'text', nullable: true })
  comentario_auditor?: string | null;

  @Column({ type: 'enum', enum: ["exitoso", "prolongado", "fallido", "otro"], nullable: true })
  motivo_cierre?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at?: Date | null;

}
