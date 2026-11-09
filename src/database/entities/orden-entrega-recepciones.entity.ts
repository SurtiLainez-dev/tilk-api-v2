import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'orden_entrega_recepciones' })
export class OrdenEntregaRecepciones {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'orden_entrega_id', type: 'bigint', unsigned: true })
  orden_entrega_id!: string;

  @Column({ name: 'orden_entrega_link_id', type: 'bigint', unsigned: true })
  orden_entrega_link_id!: string;

  @Column({ name: 'nombre_recibe', type: 'varchar', length: 200 })
  nombre_recibe!: string;

  @Column({ name: 'identidad_recibe', type: 'varchar', length: 50, nullable: true })
  identidad_recibe!: string | null;

  @Column({ name: 'telefono_recibe', type: 'varchar', length: 50, nullable: true })
  telefono_recibe!: string | null;

  @Column({ name: 'relacion_cliente', type: 'varchar', length: 50, nullable: true })
  relacion_cliente!: string | null;

  @Column({ name: 'acepta_declaracion', type: 'tinyint', default: 0 })
  acepta_declaracion!: number;

  @Column({ name: 'firma_path', type: 'varchar', length: 500 })
  firma_path!: string;

  @Column({ name: 'fecha_recepcion', type: 'timestamp' })
  fecha_recepcion!: Date;

  @Column({ name: 'ip', type: 'varchar', length: 45, nullable: true })
  ip!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  user_agent!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
