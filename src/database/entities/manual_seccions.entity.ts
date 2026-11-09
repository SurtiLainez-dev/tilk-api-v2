import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("manual_seccions")
export class ManualSeccions {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 30 })
  titulo_corto!: string;

  @Column({ type: 'varchar', length: 100 })
  titulo!: string;

  @Column({ type: 'varchar', length: 400 })
  detalle!: string;

  @Column({ type: 'tinyint' })
  estado!: number;

  @Column({ type: 'varchar', length: 9, nullable: true })
  color?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
