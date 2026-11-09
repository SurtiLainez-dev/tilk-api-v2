import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'presupuesto_caja_chicas' })
export class PresupuestoCajaChicasEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'caja_chica_id', type: 'bigint', unsigned: true })
  caja_chica_id!: string;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fecha_inicio!: string;

  @Column({ name: 'fecha_final', type: 'date' })
  fecha_final!: string;

  @Column({ name: 'titulo', type: 'text' })
  titulo!: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones!: string | null;

  @Column({ name: 'observaciones_cierre', type: 'text', nullable: true })
  observaciones_cierre!: string | null;

  @Column({ name: 'estado', type: 'enum', enum: ['BORRADOR', 'EJECUCION', 'APROBADO', 'RECHAZADO'] })
  estado!: string;

  @Column({ name: 'total_solicitado', type: 'double', precision: 9, scale: 2 })
  total_solicitado!: number;

  @Column({ name: 'total_aprobado', type: 'double', precision: 9, scale: 2, default: 0.00 })
  total_aprobado!: number;

  @Column({ name: 'total_ejecutado', type: 'double', precision: 9, scale: 2, default: 0.00 })
  total_ejecutado!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
