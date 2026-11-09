import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_k_task_attachments' })
export class TKTaskAttachmentsEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  task_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  project_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  comment_id?: string | null;

  @Column({ type: 'bigint', unsigned: true })
  uploaded_by_user_id!: string;

  @Column({ type: 'varchar', length: 255 })
  nombre_original!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombre_guardado?: string | null;

  @Column({ type: 'varchar', length: 255 })
  ruta!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  extension?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mime_type?: string | null;

  @Column({ type: 'bigint', nullable: true })
  peso_bytes?: string | null;

  @Column({ type: 'text', nullable: true })
  detalle?: string | null;

  @Column({ type: 'tinyint', default: 0 })
  es_evidencia!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at?: Date | null;

}
