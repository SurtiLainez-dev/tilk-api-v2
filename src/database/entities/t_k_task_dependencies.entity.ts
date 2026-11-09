import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_k_task_dependencies' })
export class TKTaskDependenciesEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  task_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  depends_on_task_id!: string;

  @Column({ type: 'enum', enum: ["FS", "SS", "FF", "SF"], default: "FS", comment: "FS=finish-start, SS=start-start, FF=finish-finish, SF=start-finish" })
  tipo_dependencia!: string;

  @Column({ type: 'int', default: 0, comment: "dias de espera adicionales entre una tarea y otra" })
  lag_dias!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
