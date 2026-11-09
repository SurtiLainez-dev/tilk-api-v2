import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("mob_cuerpo_traslados")
export class MobCuerpoTraslados {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  mob_traslado_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  mob_mobiliario_id!: string;

  @Column({ type: 'tinyint' })
  estado!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
