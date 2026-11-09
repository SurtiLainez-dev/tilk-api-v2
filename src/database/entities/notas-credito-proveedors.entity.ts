import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notas_credito_proveedors' })
export class NotasCreditoProveedors {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'referencia', type: 'varchar', length: 19 })
  referencia!: string;

  @Column({ name: 'factura_proveedor_id', type: 'bigint', unsigned: true })
  factura_proveedor_id!: string;

  @Column({ name: 'concepto', type: 'varchar', length: 255 })
  concepto!: string;

  @Column({ name: 'file', type: 'varchar', length: 255 })
  file!: string;

  @Column({ name: 'fecha_creado', type: 'date' })
  fecha_creado!: string;

  @Column({ name: 'total', type: 'double', precision: 9, scale: 2 })
  total!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
