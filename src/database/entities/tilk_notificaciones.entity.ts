import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tilk_notificaciones' })
export class TilkNotificacionesEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'char', length: 36 })
  uuid!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  detalle_breve?: string | null;

  @Column({ type: 'longtext', nullable: true })
  detalle_largo?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  user_crea_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  user_destino_id?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ruta?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  parametro?: string | null;

  @Column({ type: 'tinyint', default: 0 })
  abierta!: number;

  @Column({ type: 'timestamp', nullable: true })
  abierta_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
