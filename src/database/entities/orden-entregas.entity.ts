import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'orden_entregas' })
export class OrdenEntregas {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'venta_id', type: 'bigint', unsigned: true })
  venta_id!: string;

  @Column({ name: 'direccion_cliente_id', type: 'bigint', unsigned: true, nullable: true })
  direccion_cliente_id!: string | null;

  @Column({ name: 'direccion_entrega', type: 'text', nullable: true })
  direccion_entrega!: string | null;

  @Column({ name: 'colonia_id', type: 'bigint', unsigned: true, nullable: true })
  colonia_id!: string | null;

  @Column({ name: 'colaborador_id', type: 'bigint', unsigned: true, nullable: true })
  colaborador_id!: string | null;

  @Column({ name: 'file', type: 'varchar', length: 255, nullable: true })
  file!: string | null;

  @Column({ name: 'fecha_finalizada', type: 'date', nullable: true })
  fecha_finalizada!: string | null;

  @Column({ name: 'estado', type: 'tinyint' })
  estado!: number;

  @Column({ name: 'revisado_admin', type: 'tinyint', default: 0 })
  revisado_admin!: number;

  @Column({ name: 'revisado_admin_at', type: 'timestamp', nullable: true })
  revisado_admin_at!: Date | null;

  @Column({ name: 'fecha_programada', type: 'date', nullable: true })
  fecha_programada!: string | null;

  @Column({ name: 'asignado_ruta_at', type: 'timestamp', nullable: true })
  asignado_ruta_at!: Date | null;

  @Column({ name: 'en_ruta_at', type: 'timestamp', nullable: true })
  en_ruta_at!: Date | null;

  @Column({ name: 'llegada_destino_at', type: 'timestamp', nullable: true })
  llegada_destino_at!: Date | null;

  @Column({ name: 'entregada_at', type: 'timestamp', nullable: true })
  entregada_at!: Date | null;

  @Column({ name: 'es_digital', type: 'tinyint', default: 0 })
  es_digital!: number;

  @Column({ name: 'token_seguimiento', type: 'varchar', length: 64, nullable: true })
  token_seguimiento!: string | null;

  @Column({ name: 'token_expira_at', type: 'timestamp', nullable: true })
  token_expira_at!: Date | null;

  @Column({ name: 'motivo_no_entrega', type: 'varchar', length: 500, nullable: true })
  motivo_no_entrega!: string | null;

  @Column({ name: 'cod', type: 'varchar', length: 15 })
  cod!: string;

  @Column({ name: 'comentarios', type: 'varchar', length: 500, nullable: true })
  comentarios!: string | null;

  @Column({ name: 'encargado', type: 'varchar', length: 50, nullable: true })
  encargado!: string | null;

  @Column({ name: 'file_save', type: 'varchar', length: 255, nullable: true })
  file_save!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'asignado_at', type: 'timestamp', nullable: true })
  asignado_at!: Date | null;

  @Column({ name: 'entregado_at', type: 'timestamp', nullable: true })
  entregado_at!: Date | null;

}
