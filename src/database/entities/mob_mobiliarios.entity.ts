import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("mob_mobiliarios")
export class MobMobiliarios {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  colaborador_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  mob_modelo_id!: string;

  @Column({ type: 'varchar', length: 15 })
  serie_s!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  serie_f?: string | null;

  @Column({ type: 'double' })
  precio_costo!: number;

  @Column({ type: 'double' })
  precio_actual!: number;

  @Column({ type: 'tinyint' })
  is_depreciacions!: number;

  @Column({ type: 'json', nullable: true })
  depreciacion?: unknown | null;

  @Column({ type: 'json', nullable: true })
  historial?: unknown | null;

  @Column({ type: 'tinyint' })
  is_consumible!: number;

  @Column({ type: 'tinyint' })
  is_unidades!: number;

  @Column({ type: 'double', nullable: true })
  unidades?: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unidad?: string | null;

  @Column({ type: 'date' })
  fecha_entrada!: string;

  @Column({ type: 'int', comment: "1: activo, 2: fuera de servicio, 3 almacenado, 4: movimiento" })
  estado!: number;

  @Column({ type: 'varchar', length: 40 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  detalles?: string | null;

  @Column({ type: 'json', nullable: true })
  referencias?: unknown | null;

  @Column({ type: 'json', nullable: true })
  etiquetas?: unknown | null;

  @Column({ type: 'json', nullable: true })
  fotos?: unknown | null;

  @Column({ type: 'tinyint' })
  is_pieza!: number;

  @Column({ type: 'json', nullable: true })
  detalles_tecnicos?: unknown | null;

  @Column({ type: 'json', nullable: true })
  componentes?: unknown | null;

  @Column({ type: 'tinyint' })
  is_etiquetas!: number;

  @Column({ type: 'int' })
  anio_depre!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

  @Column({ type: 'double', nullable: true })
  unidades_inicio?: number | null;

}
