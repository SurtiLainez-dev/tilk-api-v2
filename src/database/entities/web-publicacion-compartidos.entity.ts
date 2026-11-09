import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'web_publicacion_compartidos' })
export class WebPublicacionCompartidosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'publicacion_id', type: 'bigint', unsigned: true })
  publicacion_id!: string;

  @Column({ name: 'identidad', type: 'varchar', length: 30, nullable: true })
  identidad!: string | null;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 255 })
  nombre_completo!: string;

  @Column({ name: 'plataforma', type: 'enum', enum: ['FACEBOOK', 'WHATSAPP', 'OTRO'] })
  plataforma!: 'FACEBOOK' | 'WHATSAPP' | 'OTRO';

  @Column({ name: 'estado', type: 'enum', enum: ['INTENTO'], default: 'INTENTO' })
  estado!: 'INTENTO';

  @Column({ name: 'visitor_token', type: 'varchar', length: 100, nullable: true })
  visitor_token!: string | null;

  @Column({ name: 'ip_hash', type: 'varchar', length: 64, nullable: true })
  ip_hash!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
