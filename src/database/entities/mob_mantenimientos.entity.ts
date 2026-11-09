import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("mob_mantenimientos")
export class MobMantenimientos {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  mob_mobiliario_id!: string;

  @Column({ type: 'date' })
  fecha_programada!: string;

  @Column({ type: 'date', nullable: true })
  fecha_realizado?: string | null;

  @Column({ type: 'bigint', unsigned: true })
  colaborador_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ type: 'int', comment: "1: pendiente, 2:realizada,3:vencida, 4: cancelada" })
  estado!: number;

  @Column({ type: 'varchar', length: 15 })
  cod!: string;

  @Column({ type: 'varchar', length: 100 })
  motivo!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacion?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
