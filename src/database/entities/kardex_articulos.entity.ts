import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("kardex_articulos")
export class KardexArticulos {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  referencia!: string;

  @Column({ type: 'bigint', unsigned: true })
  articulo_id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  remision_articulo_id?: string | null;

  @Column({ type: 'enum', enum: ["ENTRADA", "SALIDA"] })
  movimiento!: string;

  @Column({ type: 'varchar', length: 50 })
  concepto!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  documento_tipo?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  documento_id?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  documento_cod?: string | null;

  @Column({ type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  sucursal_destino_id?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  cantidad!: string;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  stock_anterior!: string;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  stock_posterior!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  user_id?: string | null;

  @Column({ type: 'text', nullable: true })
  observacion?: string | null;

  @Column({ type: 'datetime' })
  fecha_movimiento!: string;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
