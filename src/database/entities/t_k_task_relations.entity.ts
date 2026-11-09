import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_k_task_relations' })
export class TKTaskRelationsEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  task_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  related_task_id!: string;

  @Column({ type: 'varchar', length: 255, comment: "relacionada, duplicada, bloquea, originada_por, complementa" })
  relation_type!: string;

  @Column({ type: 'text', nullable: true })
  detalle?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
