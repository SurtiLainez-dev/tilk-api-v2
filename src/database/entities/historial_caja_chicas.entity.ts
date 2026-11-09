import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("historial_caja_chicas")
export class HistorialCajaChicas {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  caja_chica_id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  ct_libro_diario_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  gasto_id?: string | null;

  @Column({ type: 'double' })
  saldo_ant!: number;

  @Column({ type: 'double' })
  saldo_transaccion!: number;

  @Column({ type: 'double' })
  saldo_actual!: number;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'time' })
  hora!: string;

  @Column({ type: 'varchar', length: 255 })
  observacion!: string;

  @Column({ type: 'int' })
  tipo!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
