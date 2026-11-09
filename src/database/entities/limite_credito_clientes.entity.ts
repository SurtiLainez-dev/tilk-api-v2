import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("limite_credito_clientes")
export class LimiteCreditoClientes {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  cliente_id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  user_id?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  monto_solicitado!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  monto_aprobado!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  monto_disponible!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  monto_utilizado!: string;

  @Column({ type: 'enum', enum: ["PENDIENTE", "ACTIVO", "BLOQUEADO", "VENCIDO", "CANCELADO"], default: "PENDIENTE" })
  estado!: string;

  @Column({ type: 'date', nullable: true })
  fecha_aprobacion?: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_vencimiento?: string | null;

  @Column({ type: 'tinyint', default: 0 })
  es_actual!: number;

  @Column({ type: 'text', nullable: true })
  observacion?: string | null;

  @Column({ type: 'enum', enum: ["SEMANAL", "QUINCENAL", "MENSUAL"] })
  forma_pago_aprobado!: string;

  @Column({ type: 'tinyint', default: 0 })
  aplica_sin_prima!: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  precalificacion_id?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firma_path?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

  @Column({ type: 'int', nullable: true, default: 0 })
  rating_aprobado?: number | null;

}
