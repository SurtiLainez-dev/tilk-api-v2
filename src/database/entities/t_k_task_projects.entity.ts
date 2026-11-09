import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_k_task_projects' })
export class TKTaskProjectsEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'char', length: 36 })
  uuid!: string;

  @Column({ type: 'varchar', length: 255 })
  cod!: string;

  @Column({ type: 'bigint', unsigned: true })
  created_by_user_id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  responsable_user_id?: string | null;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  detalle?: string | null;

  @Column({ type: 'enum', enum: ["ABIERTO", "PAUSADO", "CERRADO"], default: "ABIERTO" })
  estado!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  color?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  img?: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: '0.00' })
  porcentaje_avance!: string;

  @Column({ type: 'date', nullable: true })
  fecha_fin?: Date | null;

  @Column({ type: 'date', nullable: true })
  fecha_cierre?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at?: Date | null;

}
