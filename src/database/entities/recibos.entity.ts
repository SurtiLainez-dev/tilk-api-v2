import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'recibos' })
export class RecibosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'total_interes', type: 'double', precision: 9, scale: 2, nullable: true })
  total_interes!: number | null;

  @Column({ name: 'total_capital', type: 'double', precision: 9, scale: 2, nullable: true })
  total_capital!: number | null;

  @Column({ name: 'total_mora', type: 'double', precision: 9, scale: 2, nullable: true })
  total_mora!: number | null;

  @Column({ name: 'codigo', type: 'varchar', length: 20 })
  codigo!: string;

  @Column({ name: 'referencia', type: 'varchar', length: 10, nullable: true })
  referencia!: string | null;

  @Column({ name: 'fecha', type: 'date' })
  fecha!: string;

  @Column({ name: 'hora', type: 'time' })
  hora!: string;

  @Column({ name: 'observacion', type: 'varchar', length: 400 })
  observacion!: string;

  @Column({ name: 'total', type: 'double' })
  total!: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'venta_id', type: 'bigint', unsigned: true, nullable: true })
  venta_id!: string | null;

  @Column({ name: 'pago', type: 'varchar', length: 150 })
  pago!: string;

  @Column({ name: 'sucursal_id', type: 'bigint', unsigned: true, nullable: true })
  sucursal_id!: string | null;

  @Column({ name: 'caja_id', type: 'bigint', unsigned: true, nullable: true })
  caja_id!: string | null;

  @Column({ name: 'file', type: 'varchar', length: 200, nullable: true })
  file!: string | null;

  @Column({ name: 'saldo_actual_venta', type: 'double', precision: 9, scale: 2 })
  saldo_actual_venta!: number;

  @Column({ name: 'saldo_nuevo', type: 'double', precision: 9, scale: 2, default: 0.00 })
  saldo_nuevo!: number;

}
