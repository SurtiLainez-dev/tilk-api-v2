import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'transferencias_externas' })
export class TransferenciasExternasEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'sucursal_id', type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ name: 'codigo', type: 'varchar', length: 15 })
  codigo!: string;

  @Column({ name: 'detalle_envio', type: 'varchar', length: 200 })
  detalle_envio!: string;

  @Column({ name: 'fecha', type: 'date' })
  fecha!: string;

  @Column({ name: 'referencia', type: 'varchar', length: 19 })
  referencia!: string;

  @Column({ name: 'remitente', type: 'varchar', length: 60 })
  remitente!: string;

  @Column({ name: 'file_generado', type: 'varchar', length: 255, nullable: true })
  file_generado!: string | null;

  @Column({ name: 'file_subdio', type: 'varchar', length: 255 })
  file_subdio!: string;

  @Column({ name: 'file_referencia', type: 'varchar', length: 255, nullable: true })
  file_referencia!: string | null;

  @Column({ name: 'cuerpo', type: 'json' })
  cuerpo!: unknown;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
