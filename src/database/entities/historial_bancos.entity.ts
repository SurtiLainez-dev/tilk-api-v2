import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("historial_bancos")
export class HistorialBancos {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  cuenta_banco_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  partida_id?: string | null;

  @Column({ type: 'varchar', length: 200 })
  detalle!: string;

  @Column({ type: 'double' })
  total!: number;

  @Column({ type: 'double' })
  saldo_inicial!: number;

  @Column({ type: 'double' })
  saldo_actual!: number;

  @Column({ type: 'tinyint', comment: "1:Entrada, 0:Salida" })
  tipo!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
