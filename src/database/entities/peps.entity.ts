import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'peps' })
export class Peps {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'fecha_aprobado', type: 'date' })
  fecha_aprobado!: string;

  @Column({ name: 'orden_entrada_id', type: 'bigint', unsigned: true, nullable: true })
  orden_entrada_id!: string | null;

  @Column({ name: 'operaciones_peps_id', type: 'bigint', unsigned: true })
  operaciones_peps_id!: string;

  @Column({ name: 'referencia', type: 'varchar', length: 30, nullable: true })
  referencia!: string | null;

  @Column({ name: 'tipo_peps', type: 'tinyint' })
  tipo_peps!: number;

  @Column({ name: 'articulo_id', type: 'bigint', unsigned: true })
  articulo_id!: string;

  @Column({ name: 'cantidad', type: 'int' })
  cantidad!: number;

  @Column({ name: 'valor_unitario', type: 'double', precision: 9, scale: 2 })
  valor_unitario!: number;

  @Column({ name: 'valor_total', type: 'double' })
  valor_total!: number;

  @Column({ name: 'sucursal_id', type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ name: 'saldo_cantidad', type: 'int' })
  saldo_cantidad!: number;

  @Column({ name: 'saldo_valor_unitario', type: 'double', precision: 9, scale: 2 })
  saldo_valor_unitario!: number;

  @Column({ name: 'saldo_valor_total', type: 'double', precision: 9, scale: 2 })
  saldo_valor_total!: number;

  @Column({ name: 'observacion', type: 'varchar', length: 200, nullable: true })
  observacion!: string | null;

  @Column({ name: 'estado_articulo_id', type: 'bigint', unsigned: true })
  estado_articulo_id!: string;

  @Column({ name: 'num_registro', type: 'varchar', length: 10 })
  num_registro!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
