import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'orden_entrega_links' })
export class OrdenEntregaLinks {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'orden_entrega_id', type: 'bigint', unsigned: true })
  orden_entrega_id!: string;

  @Column({ name: 'creado_por', type: 'bigint', unsigned: true })
  creado_por!: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  token_hash!: string;

  @Column({ name: 'expira_at', type: 'timestamp' })
  expira_at!: Date;

  @Column({ name: 'abierto_at', type: 'timestamp', nullable: true })
  abierto_at!: Date | null;

  @Column({ name: 'completado_at', type: 'timestamp', nullable: true })
  completado_at!: Date | null;

  @Column({ name: 'revocado_at', type: 'timestamp', nullable: true })
  revocado_at!: Date | null;

  @Column({ name: 'ip_creacion', type: 'varchar', length: 45, nullable: true })
  ip_creacion!: string | null;

  @Column({ name: 'ip_apertura', type: 'varchar', length: 45, nullable: true })
  ip_apertura!: string | null;

  @Column({ name: 'user_agent_apertura', type: 'text', nullable: true })
  user_agent_apertura!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
