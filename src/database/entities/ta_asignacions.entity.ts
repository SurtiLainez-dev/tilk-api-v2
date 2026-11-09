import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ta_asignacions' })
export class TaAsignacionsEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  titulo!: string;

  @Column({ type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ type: 'date' })
  fecha_asignado!: Date;

  @Column({ type: 'date', nullable: true })
  fecha_limite?: Date | null;

  @Column({ type: 'date', nullable: true })
  fecha_cierre?: Date | null;

  @Column({ type: 'int', default: 1, comment: "1: Sin abrir, 2:abierta, 3: finalizada, 4 vencida" })
  estado!: number;

  @Column({ type: 'json', nullable: true })
  comentarios?: unknown | null;

  @Column({ type: 'json', nullable: true })
  check_lists?: unknown | null;

  @Column({ type: 'varchar', length: 240 })
  detalle!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  usuario_asignado_id?: string | null;

  @Column({ type: 'int' })
  calificacion!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
