import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("historial_facturas")
export class HistorialFacturas {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  factura_proveedor_id!: string;

  @Column({ type: 'varchar', length: 150 })
  concepto!: string;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'varchar', length: 25 })
  referencia!: string;

  @Column({ type: 'int' })
  tipo!: number;

  @Column({ type: 'double' })
  monto!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
