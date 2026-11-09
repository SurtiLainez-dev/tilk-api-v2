import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tabla_venta_financieras' })
export class TablaVentaFinancierasEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  venta_id!: string;

  @Column({ type: 'double' })
  precio_contado_financiacion!: number;

  @Column({ type: 'double', default: 0.00 })
  precio_contado_final!: number;

  @Column({ type: 'double', default: 0 })
  saldo_actual!: number;

  @Column({ type: 'varchar', length: 500 })
  detalle_articulo!: string;

  @Column({ type: 'int', default: 0, comment: "0:no revisado por la financiera. 1: revisado por la financiera 2: discordia 3: pendiente pagar 4:cancelado 5: problema 6: revision aun" })
  estado!: number;

  @Column({ type: 'json', nullable: true })
  comentarios?: unknown | null;

  @Column({ type: 'date', nullable: true })
  fecha_aprobado?: Date | null;

  @Column({ type: 'date', nullable: true })
  fecha_vencimiento?: Date | null;

  @Column({ type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ type: 'json', nullable: true })
  pagos?: unknown | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
