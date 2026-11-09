import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'pagos_facturas' })
export class PagosFacturas {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'factura_proveedor_id', type: 'bigint', unsigned: true })
  factura_proveedor_id!: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 150 })
  descripcion!: string;

  @Column({ name: 'num_pago', type: 'int' })
  num_pago!: number;

  @Column({ name: 'total_a_pagar', type: 'double', precision: 9, scale: 2 })
  total_a_pagar!: number;

  @Column({ name: 'total_pagado', type: 'double', precision: 9, scale: 2 })
  total_pagado!: number;

  @Column({ name: 'saldo_pendiente', type: 'double', precision: 9, scale: 2 })
  saldo_pendiente!: number;

  @Column({ name: 'fecha_pago', type: 'date' })
  fecha_pago!: string;

  @Column({ name: 'estado', type: 'int' })
  estado!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'mora', type: 'double', precision: 9, scale: 2, nullable: true })
  mora!: number | null;

}
