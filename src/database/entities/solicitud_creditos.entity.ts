import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'solicitud_creditos' })
export class SolicitudCreditosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'carrito_compra_id', type: 'bigint', unsigned: true, nullable: true })
  carrito_compra_id!: string | null;

  @Column({ name: 'cliente_id', type: 'bigint', unsigned: true })
  cliente_id!: string;

  @Column({ name: 'articulo_id', type: 'bigint', unsigned: true, nullable: true })
  articulo_id!: string | null;

  @Column({ name: 'saldo_financiar', type: 'double', precision: 9, scale: 2 })
  saldo_financiar!: number;

  @Column({ name: 'tasa', type: 'double', precision: 5, scale: 2, nullable: true })
  tasa!: number | null;

  @Column({ name: 'codigo', type: 'varchar', length: 255 })
  codigo!: string;

  @Column({ name: 'tiempo', type: 'int' })
  tiempo!: number;

  @Column({ name: 'forma_pago', type: 'varchar', length: 15 })
  forma_pago!: string;

  @Column({ name: 'detalles_precio', type: 'json' })
  detalles_precio!: Record<string, unknown> | unknown[];

  @Column({ name: 'referencias', type: 'json' })
  referencias!: Record<string, unknown> | unknown[];

  @Column({ name: 'estado', type: 'int' })
  estado!: number;

  @Column({ name: 'estado_revision', type: 'enum', enum: ['BORRADOR', 'EN_REVISION', 'APROBADO', 'RECHAZADO', 'CANCELADO', 'CONVERTIDO_VENTA', 'DEVUELTO'], default: "BORRADOR" })
  estado_revision!: string;

  @Column({ name: 'fecha_enviado_revision', type: 'timestamp', nullable: true })
  fecha_enviado_revision!: Date | null;

  @Column({ name: 'fecha_revision', type: 'timestamp', nullable: true })
  fecha_revision!: Date | null;

  @Column({ name: 'fecha_rechazo', type: 'timestamp', nullable: true })
  fecha_rechazo!: Date | null;

  @Column({ name: 'revisado_por_user_id', type: 'bigint', unsigned: true, nullable: true })
  revisado_por_user_id!: string | null;

  @Column({ name: 'motivo_rechazo', type: 'text', nullable: true })
  motivo_rechazo!: string | null;

  @Column({ name: 'observacion_revision', type: 'longtext', nullable: true })
  observacion_revision!: string | null;

  @Column({ name: 'precio_contado', type: 'double', precision: 9, scale: 2 })
  precio_contado!: number;

  @Column({ name: 'prima', type: 'double', precision: 9, scale: 2 })
  prima!: number;

  @Column({ name: 'observacion_precio', type: 'varchar', length: 255, nullable: true })
  observacion_precio!: string | null;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'sucursal_id', type: 'bigint', unsigned: true, nullable: true })
  sucursal_id!: string | null;

  @Column({ name: 'comentarios', type: 'json', nullable: true })
  comentarios!: Record<string, unknown> | unknown[] | null;

  @Column({ name: 'tareas', type: 'json', nullable: true })
  tareas!: Record<string, unknown> | unknown[] | null;

  @Column({ name: 'cuota', type: 'double', precision: 9, scale: 2 })
  cuota!: number;

  @Column({ name: 'total_credito', type: 'decimal', precision: 12, scale: 2, default: '0.00' })
  total_credito!: string;

  @Column({ name: 'prima_total', type: 'decimal', precision: 12, scale: 2, default: '0.00' })
  prima_total!: string;

  @Column({ name: 'cuota_total', type: 'decimal', precision: 12, scale: 2, default: '0.00' })
  cuota_total!: string;

  @Column({ name: 'cantidad_cuotas', type: 'int', default: 0 })
  cantidad_cuotas!: number;

  @Column({ name: 'frecuencia_pago', type: 'enum', enum: ['SEMANAL', 'QUINCENAL', 'MENSUAL', 'MIXTO'], nullable: true })
  frecuencia_pago!: string | null;

  @Column({ name: 'preview_cuotas', type: 'json', nullable: true })
  preview_cuotas!: Record<string, unknown> | unknown[] | null;

  @Column({ name: 'file', type: 'varchar', length: 255, nullable: true })
  file!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'fecha_creado', type: 'date', nullable: true })
  fecha_creado!: string | null;

  @Column({ name: 'combo_id', type: 'bigint', unsigned: true, nullable: true })
  combo_id!: string | null;

  @Column({ name: 'fecha_reenviado', type: 'timestamp', nullable: true })
  fecha_reenviado!: Date | null;

  @Column({ name: 'is_combo', type: 'tinyint', default: 0 })
  is_combo!: number;

  @Column({ name: 'venta_financiera', type: 'tinyint', default: 0 })
  venta_financiera!: number;

  @Column({ name: 'limite_credito_id', type: 'bigint', unsigned: true, nullable: true })
  limite_credito_id!: string | null;

  @Column({ name: 'limite_credito_snapshot', type: 'json', nullable: true })
  limite_credito_snapshot!: Record<string, unknown> | unknown[] | null;

  @Column({ name: 'numero_revision', type: 'int', nullable: true, default: 1 })
  numero_revision!: number | null;

  @Column({ name: 'planes_aprobados_snapshot', type: 'json', nullable: true })
  planes_aprobados_snapshot!: Record<string, unknown> | unknown[] | null;

  @Column({ name: 'fecha_devuelto', type: 'timestamp', nullable: true })
  fecha_devuelto!: Date | null;

  @Column({ name: 'fecha_aprobacion', type: 'timestamp', nullable: true })
  fecha_aprobacion!: Date | null;

}
