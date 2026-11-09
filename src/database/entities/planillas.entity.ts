import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'planillas' })
export class Planillas {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'sucursal_id', type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'codigo', type: 'varchar', length: 13 })
  codigo!: string;

  @Column({ name: 'fecha_creacion', type: 'date' })
  fecha_creacion!: string;

  @Column({ name: 'estado', type: 'tinyint' })
  estado!: number;

  @Column({ name: 'direccion_archivo', type: 'varchar', length: 255, nullable: true })
  direccion_archivo!: string | null;

  @Column({ name: 'total_planilla', type: 'double', precision: 8, scale: 2 })
  total_planilla!: number;

  @Column({ name: 'observacion', type: 'varchar', length: 250, nullable: true })
  observacion!: string | null;

  @Column({ name: 'mes_asignado', type: 'varchar', length: 255 })
  mes_asignado!: string;

  @Column({ name: 'mes', type: 'int' })
  mes!: number;

  @Column({ name: 'ano', type: 'int' })
  ano!: number;

  @Column({ name: 'periodo', type: 'varchar', length: 30 })
  periodo!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'file', type: 'varchar', length: 255, nullable: true })
  file!: string | null;

  @Column({ name: 'is_pagado', type: 'tinyint', nullable: true })
  is_pagado!: number | null;

  @Column({ name: 'lote_planilla_id', type: 'bigint', unsigned: true, nullable: true })
  lote_planilla_id!: string | null;

  @Column({ name: 'estado_lote', type: 'tinyint', default: 1 })
  estado_lote!: number;

}
