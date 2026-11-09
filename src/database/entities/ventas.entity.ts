import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ventas' })
export class VentasEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'sdc_id', type: 'bigint', unsigned: true, nullable: true })
  sdc_id!: string | null;

  @Column({ name: 'slug', type: 'varchar', length: 255, nullable: true })
  slug!: string | null;

  @Column({ name: 'tipo_venta', type: 'int' })
  tipo_venta!: number;

  @Column({ name: 'cod', type: 'varchar', length: 15 })
  cod!: string;

  @Column({ name: 'cliente_id', type: 'bigint', unsigned: true })
  cliente_id!: string;

  @Column({ name: 'colaborador_id', type: 'bigint', unsigned: true })
  colaborador_id!: string;

  @Column({ name: 'total', type: 'double', precision: 9, scale: 2 })
  total!: number;

  @Column({ name: 'saldo_actual', type: 'double', precision: 9, scale: 2 })
  saldo_actual!: number;

  @Column({ name: 'estado', type: 'int' })
  estado!: number;

  @Column({ name: 'num_cuotas', type: 'int' })
  num_cuotas!: number;

  @Column({ name: 'is_aceptado', type: 'int' })
  is_aceptado!: number;

  @Column({ name: 'revisado_ventas', type: 'tinyint', default: 0 })
  revisado_ventas!: number;

  @Column({ name: 'is_facturado', type: 'tinyint', default: 0 })
  is_facturado!: number;

  @Column({ name: 'estado_cuenta', type: 'json', nullable: true })
  estado_cuenta!: unknown | null;

  @Column({ name: 'tasa_mora', type: 'double', precision: 5, scale: 2 })
  tasa_mora!: number;

  @Column({ name: 'finalizacion_garantia', type: 'date', nullable: true })
  finalizacion_garantia!: string | null;

  @Column({ name: 'estado_garantia', type: 'tinyint' })
  estado_garantia!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'sucursal_id', type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ name: 'facturada', type: 'tinyint', nullable: true })
  facturada!: number | null;

  @Column({ name: 'descuento', type: 'double', precision: 9, scale: 2, nullable: true, default: 0.00 })
  descuento!: number | null;

  @Column({ name: 'is_segunda', type: 'tinyint', nullable: true, default: 1 })
  is_segunda!: number | null;

  @Column({ name: 'comentarios', type: 'json', nullable: true })
  comentarios!: unknown | null;

  @Column({ name: 'estado_articulo', type: 'int', nullable: true, default: 1 })
  estado_articulo!: number | null;

  @Column({ name: 'cob_segmento_id', type: 'bigint', unsigned: true, nullable: true })
  cob_segmento_id!: string | null;

  @Column({ name: 'cob_portafolio_id', type: 'bigint', unsigned: true, nullable: true })
  cob_portafolio_id!: string | null;

  @Column({ name: 'archivos_gestion', type: 'json', nullable: true })
  archivos_gestion!: unknown | null;

  @Column({ name: 'gestiones', type: 'json', nullable: true })
  gestiones!: unknown | null;

  @Column({ name: 'proxima_gestion', type: 'date', nullable: true })
  proxima_gestion!: string | null;

  @Column({ name: 'pagando', type: 'double', precision: 9, scale: 2, default: 0.00 })
  pagando!: number;

  @Column({ name: 'saldo_actual_cap', type: 'double', precision: 22, default: 0 })
  saldo_actual_cap!: number;

  @Column({ name: 'revision_documentos', type: 'tinyint', default: 0 })
  revision_documentos!: number;

  @Column({ name: 'usuarios', type: 'json', nullable: true })
  usuarios!: unknown | null;

  @Column({ name: 'is_combo', type: 'tinyint', nullable: true })
  is_combo!: number | null;

  @Column({ name: 'combo_id', type: 'bigint', unsigned: true, nullable: true })
  combo_id!: string | null;

  @Column({ name: 'total_abonado_capital', type: 'double', precision: 9, scale: 2, default: 0.00 })
  total_abonado_capital!: number;

  @Column({ name: 'total_abonado', type: 'double', precision: 9, scale: 2, default: 0.00 })
  total_abonado!: number;

  @Column({ name: 'mora', type: 'double', precision: 9, scale: 2, default: 0.00 })
  mora!: number;

  @Column({ name: 'cuota', type: 'double', precision: 9, scale: 2, default: 0.00 })
  cuota!: number;

  @Column({ name: 'forma_pago', type: 'int', default: 0 })
  forma_pago!: number;

  @Column({ name: 'fecha_prima', type: 'date', nullable: true })
  fecha_prima!: string | null;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fecha_vencimiento!: string | null;

  @Column({ name: 'prima', type: 'double', precision: 9, scale: 2, default: 0.00 })
  prima!: number;

  @Column({ name: 'dias_mora', type: 'int', default: 0 })
  dias_mora!: number;

  @Column({ name: 'saldo_financiar', type: 'double', precision: 9, scale: 2, default: 0.00 })
  saldo_financiar!: number;

  @Column({ name: 'venta_financiera', type: 'tinyint', default: 0 })
  venta_financiera!: number;

  @Column({ name: 'is_fast', type: 'tinyint', nullable: true, default: 0 })
  is_fast!: number | null;

}
