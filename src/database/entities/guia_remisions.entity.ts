import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("guia_remisions")
export class GuiaRemisions {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  orden_entrada_id!: string;

  @Column({ type: 'varchar', length: 30 })
  num_guia!: string;

  @Column({ type: 'bigint', unsigned: true })
  colaborador_id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

  @Column({ type: 'tinyint', nullable: true, default: 0 })
  tipo?: number | null;

}
