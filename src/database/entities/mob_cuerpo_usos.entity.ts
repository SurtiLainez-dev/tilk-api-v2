import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("mob_cuerpo_usos")
export class MobCuerpoUsos {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  mob_uso_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  mob_mobiliario_id!: string;

  @Column({ type: 'double', nullable: true })
  cantidad_salida?: number | null;

  @Column({ type: 'double', nullable: true })
  cantidad_entrada?: number | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
