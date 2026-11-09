import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'telefonos_clientes' })
export class TelefonosClientesEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 4 })
  cod_pais!: string;

  @Column({ type: 'varchar', length: 50 })
  tel!: string;

  @Column({ type: 'varchar', length: 100 })
  detalle!: string;

  @Column({ type: 'tinyint', default: 0 })
  is_principal!: number;

  @Column({ type: 'bigint', unsigned: true })
  cliente_id!: string;

  @Column({ type: 'tinyint', nullable: true, default: 1 })
  marketing?: number | null;

  @Column({ type: 'tinyint', nullable: true, default: 1 })
  notificaciones?: number | null;

  @Column({ type: 'tinyint', nullable: true, default: 1 })
  mensajes_whatsaap?: number | null;

  @Column({ type: 'tinyint', nullable: true, default: 1 })
  mensajes_texto?: number | null;

  @Column({ type: 'date' })
  ultima_verificacion!: Date;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion?: string | null;

}
