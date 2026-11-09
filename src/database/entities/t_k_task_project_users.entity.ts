import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_k_task_project_users' })
export class TKTaskProjectUsersEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  project_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ type: 'enum', enum: ["RESPONSABLE", "PARTICIPANTE", "OBSERVADOR", "AUDITOR"] })
  rol!: string;

  @Column({ type: 'tinyint', default: 0 })
  es_responsable!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
