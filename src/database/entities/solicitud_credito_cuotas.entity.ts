import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'solicitud_credito_cuotas' })
export class SolicitudCreditoCuotasEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'solicitud_credito_id', type: 'bigint', unsigned: true })
  solicitud_credito_id!: string;

  @Column({ name: 'numero_revision', type: 'int', unsigned: true, default: 1 })
  numero_revision!: number;

  @Column({ name: 'carrito_compra_plan_id', type: 'bigint', unsigned: true, nullable: true })
  carrito_compra_plan_id!: string | null;

  @Column({ name: 'cuerpo_carrito_compra_id', type: 'bigint', unsigned: true, nullable: true })
  cuerpo_carrito_compra_id!: string | null;

  @Column({ name: 'articulo_id', type: 'bigint', unsigned: true, nullable: true })
  articulo_id!: string | null;

  @Column({ name: 'numero_cuota', type: 'int', unsigned: true, default: 0 })
  numero_cuota!: number;

  @Column({ name: 'total_cuotas', type: 'int', unsigned: true, default: 0 })
  total_cuotas!: number;

  @Column({ name: 'orden_pago', type: 'int', unsigned: true, default: 0 })
  orden_pago!: number;

  @Column({ name: 'fecha_original', type: 'date', nullable: true })
  fecha_original!: string | null;

  @Column({ name: 'fecha_pago', type: 'date', nullable: true })
  fecha_pago!: string | null;

  @Column({ name: 'monto', type: 'decimal', precision: 12, scale: 2, default: '0.00' })
  monto!: string;

  @Column({ name: 'monto_prima', type: 'decimal', precision: 12, scale: 2, default: '0.00' })
  monto_prima!: string;

  @Column({ name: 'monto_cuota', type: 'decimal', precision: 12, scale: 2, default: '0.00' })
  monto_cuota!: string;

  @Column({ name: 'tipo_pago', type: 'enum', enum: ['PAGO_INICIAL', 'CUOTA'], default: "CUOTA" })
  tipo_pago!: string;

  @Column({ name: 'periodo_pago', type: 'enum', enum: ['SEMANAL', 'QUINCENAL', 'MENSUAL'], nullable: true })
  periodo_pago!: string | null;

  @Column({ name: 'estado', type: 'enum', enum: ['PROYECTADA', 'APROBADA', 'CONVERTIDA', 'ANULADA'], default: "PROYECTADA" })
  estado!: string;

  @Column({ name: 'plan_snapshot', type: 'json', nullable: true })
  plan_snapshot!: Record<string, unknown> | unknown[] | null;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata!: Record<string, unknown> | unknown[] | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
