import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'orden_entradas' })
export class OrdenEntradas {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'tipo_entrada_articulo_id', type: 'bigint', unsigned: true })
  tipo_entrada_articulo_id!: string;

  @Column({ name: 'proveedor_id', type: 'bigint', unsigned: true })
  proveedor_id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'sucursal_id', type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ name: 'fecha_creacion', type: 'date' })
  fecha_creacion!: string;

  @Column({ name: 'observacion', type: 'varchar', length: 1000, nullable: true })
  observacion!: string | null;

  @Column({ name: 'codigo', type: 'varchar', length: 15 })
  codigo!: string;

  @Column({ name: 'estado', type: 'tinyint' })
  estado!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'file', type: 'varchar', length: 255, nullable: true })
  file!: string | null;

  @Column({ name: 'file_subdio', type: 'varchar', length: 255, nullable: true })
  file_subdio!: string | null;

}
