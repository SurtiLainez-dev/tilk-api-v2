import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("historial_ccs")
export class HistorialCcs {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  cc_id!: string;

  @Column({ type: 'varchar', length: 500 })
  concepto!: string;

  @Column({ type: 'varchar', length: 14 })
  partida!: string;

  @Column({ type: 'int' })
  tipo!: number;

  @Column({ type: 'double' })
  total!: number;

  @Column({ type: 'double' })
  total_nuevo!: number;

  @Column({ type: 'double' })
  total_viejo!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
