import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'solicitud_credito_comentarios' })
export class SolicitudCreditoComentariosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'solicitud_credito_id', type: 'bigint', unsigned: true })
  solicitud_credito_id!: string;

  @Column({ name: 'numero_revision', type: 'int', unsigned: true, default: 1 })
  numero_revision!: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true })
  user_id!: string | null;

  @Column({ name: 'tipo', type: 'enum', enum: ['COMENTARIO', 'REVISION', 'DEVOLUCION', 'REENVIO', 'APROBACION', 'RECHAZO', 'CANCELACION', 'SISTEMA'], default: "COMENTARIO" })
  tipo!: string;

  @Column({ name: 'comentario', type: 'longtext' })
  comentario!: string;

  @Column({ name: 'visible_vendedor', type: 'tinyint', default: 1 })
  visible_vendedor!: number;

  @Column({ name: 'es_sistema', type: 'tinyint', default: 0 })
  es_sistema!: number;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata!: Record<string, unknown> | unknown[] | null;

  @Column({ name: 'estado', type: 'tinyint', default: 1 })
  estado!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
