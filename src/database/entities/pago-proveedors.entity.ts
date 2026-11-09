import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'pago_proveedors' })
export class PagoProveedors {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'forma_pago_id', type: 'bigint', unsigned: true })
  forma_pago_id!: string;

  @Column({ name: 'cuenta_banco_id', type: 'bigint', unsigned: true })
  cuenta_banco_id!: string;

  @Column({ name: 'referencia', type: 'varchar', length: 35 })
  referencia!: string;

  @Column({ name: 'total_pago', type: 'double', precision: 9, scale: 2 })
  total_pago!: number;

  @Column({ name: 'total_mora', type: 'double', precision: 9, scale: 2 })
  total_mora!: number;

  @Column({ name: 'observacion', type: 'varchar', length: 200, nullable: true })
  observacion!: string | null;

  @Column({ name: 'pagos_factura_id', type: 'bigint', unsigned: true })
  pagos_factura_id!: string;

  @Column({ name: 'archivos', type: 'json', nullable: true })
  archivos!: unknown | null;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'codigo', type: 'int' })
  codigo!: number;

  @Column({ name: 'pago', type: 'double', precision: 9, scale: 2 })
  pago!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'ct_partida_id', type: 'bigint', unsigned: true, nullable: true })
  ct_partida_id!: string | null;

}
