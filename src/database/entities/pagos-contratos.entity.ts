import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'pagos_contratos' })
export class PagosContratos {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'venta_id', type: 'bigint', unsigned: true })
  venta_id!: string;

  @Column({ name: 'pago_inicial', type: 'double', precision: 9, scale: 2 })
  pago_inicial!: number;

  @Column({ name: 'total_pago', type: 'double', precision: 9, scale: 2 })
  total_pago!: number;

  @Column({ name: 'total_abonado', type: 'double', precision: 9, scale: 2 })
  total_abonado!: number;

  @Column({ name: 'saldo_actual', type: 'double', precision: 9, scale: 2 })
  saldo_actual!: number;

  @Column({ name: 'detalle', type: 'varchar', length: 40 })
  detalle!: string;

  @Column({ name: 'is_mora', type: 'tinyint' })
  is_mora!: number;

  @Column({ name: 'mora', type: 'double', precision: 9, scale: 2 })
  mora!: number;

  @Column({ name: 'inicio_mora', type: 'date', nullable: true })
  inicio_mora!: string | null;

  @Column({ name: 'capital', type: 'double', precision: 9, scale: 2 })
  capital!: number;

  @Column({ name: 'interes', type: 'double', precision: 9, scale: 2 })
  interes!: number;

  @Column({ name: 'fecha_pago', type: 'date' })
  fecha_pago!: string;

  @Column({ name: 'is_cobro_mora', type: 'tinyint' })
  is_cobro_mora!: number;

  @Column({ name: 'estado', type: 'int' })
  estado!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'saldo_antes', type: 'double', precision: 9, scale: 2, nullable: true })
  saldo_antes!: number | null;

  @Column({ name: 'saldo_despues', type: 'double', precision: 9, scale: 2, nullable: true })
  saldo_despues!: number | null;

  @Column({ name: 'saldo_capital', type: 'double', precision: 9, scale: 2, nullable: true })
  saldo_capital!: number | null;

  @Column({ name: 'saldo_intereses', type: 'double', precision: 9, scale: 2, nullable: true })
  saldo_intereses!: number | null;

  @Column({ name: 'dias_mora', type: 'int', nullable: true })
  dias_mora!: number | null;

  @Column({ name: 'dias_gracia', type: 'int', nullable: true, default: 5 })
  dias_gracia!: number | null;

  @Column({ name: 'saldo_cap', type: 'double', precision: 9, scale: 2, nullable: true })
  saldo_cap!: number | null;

  @Column({ name: 'proceso_pago_online', type: 'tinyint', nullable: true, default: 0 })
  proceso_pago_online!: number | null;

}
