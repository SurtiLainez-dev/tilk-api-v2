import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notificacions' })
export class Notificacions {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'titulo', type: 'varchar', length: 50 })
  titulo!: string;

  @Column({ name: 'mensaje', type: 'varchar', length: 300 })
  mensaje!: string;

  @Column({ name: 'url', type: 'varchar', length: 150, nullable: true })
  url!: string | null;

  @Column({ name: 'estado', type: 'tinyint', default: 0 })
  estado!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
