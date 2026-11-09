import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'remision_transferencias' })
export class RemisionTransferenciasEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'transferencia_articulo_id', type: 'bigint', unsigned: true })
  transferencia_articulo_id!: string;

  @Column({ name: 'colaborador_id', type: 'bigint', unsigned: true })
  colaborador_id!: string;

  @Column({ name: 'colaborador_recibe', type: 'bigint', unsigned: true, nullable: true })
  colaborador_recibe!: string | null;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'codigo_remision', type: 'varchar', length: 15 })
  codigo_remision!: string;

  @Column({ name: 'fecha_envio', type: 'date' })
  fecha_envio!: string;

  @Column({ name: 'fecha_recibido', type: 'date', nullable: true })
  fecha_recibido!: string | null;

  @Column({ name: 'observacion', type: 'varchar', length: 255, nullable: true })
  observacion!: string | null;

  @Column({ name: 'file_generado', type: 'varchar', length: 255, nullable: true })
  file_generado!: string | null;

  @Column({ name: 'file_subido', type: 'varchar', length: 255, nullable: true })
  file_subido!: string | null;

  @Column({ name: 'estado', type: 'tinyint' })
  estado!: number;

  @Column({ name: 'colaborador_traslado', type: 'bigint', unsigned: true, nullable: true })
  colaborador_traslado!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'numeracion', type: 'varchar', length: 19, nullable: true })
  numeracion!: string | null;

}
