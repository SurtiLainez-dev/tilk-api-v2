import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'nota_credito_clientes' })
export class NotaCreditoClientes {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'cc_id', type: 'bigint', unsigned: true })
  cc_id!: string;

  @Column({ name: 'monto', type: 'double', precision: 9, scale: 2 })
  monto!: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'ct_libro_diario_id', type: 'bigint', unsigned: true, nullable: true })
  ct_libro_diario_id!: string | null;

  @Column({ name: 'referencia', type: 'varchar', length: 20 })
  referencia!: string;

  @Column({ name: 'concepto', type: 'varchar', length: 150 })
  concepto!: string;

  @Column({ name: 'venta_id', type: 'bigint', unsigned: true })
  venta_id!: string;

  @Column({ name: 'tipo_nota_credito_id', type: 'bigint', unsigned: true })
  tipo_nota_credito_id!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'recibo_id', type: 'bigint', unsigned: true, nullable: true })
  recibo_id!: string | null;

  @Column({ name: 'recibo_id_2', type: 'bigint', unsigned: true, nullable: true })
  recibo_id_2!: string | null;

  @Column({ name: 'saldo_anterior', type: 'double', precision: 9, scale: 2, default: 0.00 })
  saldo_anterior!: number;

  @Column({ name: 'saldo_nuevo', type: 'double', precision: 9, scale: 2, default: 0.00 })
  saldo_nuevo!: number;

  @Column({ name: 'tipo', type: 'tinyint', default: 1 })
  tipo!: number;

}
