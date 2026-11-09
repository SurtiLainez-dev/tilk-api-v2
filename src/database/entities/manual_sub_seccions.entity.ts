import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("manual_sub_seccions")
export class ManualSubSeccions {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  manual_seccion_id!: string;

  @Column({ type: 'varchar', length: 100 })
  titulo!: string;

  @Column({ type: 'varchar', length: 250 })
  detalle!: string;

  @Column({ type: 'tinyint' })
  estado!: number;

  @Column({ type: 'json', nullable: true })
  contenido?: unknown | null;

  @Column({ type: 'json', nullable: true })
  fotos?: unknown | null;

  @Column({ type: 'json', nullable: true })
  draws?: unknown | null;

  @Column({ type: 'json', nullable: true })
  videos?: unknown | null;

  @Column({ type: 'json', nullable: true })
  comentarios?: unknown | null;

  @Column({ type: 'tinyint', default: 0 })
  error!: number;

  @Column({ type: 'tinyint', default: 0 })
  end!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
