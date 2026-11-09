import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'transferencia_articulos' })
export class TransferenciaArticulosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'sucursal_id', type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ name: 'codigo', type: 'varchar', length: 15 })
  codigo!: string;

  @Column({ name: 'motivo_traslado_id', type: 'bigint', unsigned: true })
  motivo_traslado_id!: string;

  @Column({ name: 'estado', type: 'tinyint', nullable: true })
  estado!: number | null;

  @Column({ name: 'estado_remision', type: 'int' })
  estado_remision!: number;

  @Column({ name: 'fecha_creado', type: 'date' })
  fecha_creado!: string;

  @Column({ name: 'sucursal_destino', type: 'bigint', unsigned: true })
  sucursal_destino!: string;

  @Column({ name: 'observacion', type: 'varchar', length: 255, nullable: true })
  observacion!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'file', type: 'varchar', length: 255, nullable: true })
  file!: string | null;

}
