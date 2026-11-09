import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("historial_articulos")
export class HistorialArticulos {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  articulo_id!: string;

  @Column({ type: 'varchar', length: 250 })
  operacion!: string;

  @Column({ type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  referencia?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
