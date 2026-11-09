import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_k_task_comments' })
export class TKTaskCommentsEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  task_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  project_id?: string | null;

  @Column({ type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  parent_id?: string | null;

  @Column({ type: 'text' })
  comentario!: string;

  @Column({ type: 'enum', enum: ["COMENTARIO", "RESPUESTA", "NOTA_INTERNA"], default: "COMENTARIO" })
  tipo!: string;

  @Column({ type: 'tinyint', default: 0 })
  interno!: number;

  @Column({ type: 'tinyint', default: 0 })
  editado!: number;

  @Column({ type: 'timestamp', nullable: true })
  editado_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at?: Date | null;

}
