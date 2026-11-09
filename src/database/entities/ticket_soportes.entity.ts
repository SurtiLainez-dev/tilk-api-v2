import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ticket_soportes' })
export class TicketSoportesEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  tipo_ticket_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  user_solicitud!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  user_responsable?: string | null;

  @Column({ type: 'varchar', length: 80 })
  titulo!: string;

  @Column({ type: 'text' })
  detalle_problema!: string;

  @Column({ type: 'date', nullable: true })
  fecha_abierto?: Date | null;

  @Column({ type: 'date', nullable: true })
  fecha_limite?: Date | null;

  @Column({ type: 'date', nullable: true })
  fecha_esperada?: Date | null;

  @Column({ type: 'text', nullable: true })
  conlucion?: string | null;

  @Column({ type: 'json', nullable: true })
  comentarios?: unknown | null;

  @Column({ type: 'varchar', length: 30 })
  cod!: string;

  @Column({ type: 'enum', enum: ["PENDIENTE", "REVISION", "CERRADO"], default: "PENDIENTE" })
  estado!: string;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
