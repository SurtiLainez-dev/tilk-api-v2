import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'pagos_extras_ventas' })
export class PagosExtrasVentas {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'venta_id', type: 'bigint', unsigned: true })
  venta_id!: string;

  @Column({ name: 'total', type: 'double', precision: 9, scale: 2 })
  total!: number;

  @Column({ name: 'descripcion', type: 'varchar', length: 150 })
  descripcion!: string;

  @Column({ name: 'observacion', type: 'varchar', length: 255, nullable: true })
  observacion!: string | null;

  @Column({ name: 'estado', type: 'int' })
  estado!: number;

  @Column({ name: 'fecha_pago', type: 'date' })
  fecha_pago!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
