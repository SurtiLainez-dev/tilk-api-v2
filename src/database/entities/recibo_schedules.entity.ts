import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'recibo_schedules' })
export class ReciboSchedulesEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'id_consulta', type: 'varchar', length: 255 })
  id_consulta!: string;

  @Column({ name: 'status', type: 'enum', enum: ['waiting', 'reversed', 'done'], default: "waiting" })
  status!: string;

  @Column({ name: 'scheduled_for', type: 'timestamp', nullable: true })
  scheduled_for!: Date | null;

  @Column({ name: 'pagos_seleccionados', type: 'json' })
  pagos_seleccionados!: Record<string, unknown> | unknown[];

  @Column({ name: 'request', type: 'json' })
  request!: Record<string, unknown> | unknown[];

  @Column({ name: 'cuenta', type: 'json' })
  cuenta!: Record<string, unknown> | unknown[];

  @Column({ name: 'comentario_rev', type: 'text', nullable: true })
  comentario_rev!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
