import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_k_task_users' })
export class TKTaskUsersEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  task_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ type: 'enum', enum: ["RESPONSABLE", "PARTICIPANTE", "OBSERVADOR", "AUDITOR"] })
  rol!: string;

  @Column({ type: 'tinyint', default: 0 })
  es_responsable!: number;

  @Column({ type: 'tinyint', default: 1 })
  puede_comentar!: number;

  @Column({ type: 'tinyint', default: 0 })
  puede_editar!: number;

  @Column({ type: 'tinyint', default: 0 })
  puede_cerrar!: number;

  @Column({ type: 'tinyint', default: 0 })
  notificar_email!: number;

  @Column({ type: 'tinyint', default: 0 })
  notificar_push!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
