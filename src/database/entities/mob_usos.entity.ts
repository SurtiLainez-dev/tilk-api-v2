import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("mob_usos")
export class MobUsos {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 15 })
  cod!: string;

  @Column({ type: 'int', comment: "1:iniciada, 2:cerrada, 3:cancelada" })
  estado!: number;

  @Column({ type: 'bigint', unsigned: true })
  colaborador_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  mantenimiento_id?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacion?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file_subido?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
