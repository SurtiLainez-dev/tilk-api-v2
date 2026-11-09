import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notificacion_modulos' })
export class NotificacionModulos {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 50 })
  nombre!: string;

  @Column({ name: 'detalle', type: 'text' })
  detalle!: string;

  @Column({ name: 'usuarios', type: 'json', nullable: true })
  usuarios!: unknown | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
