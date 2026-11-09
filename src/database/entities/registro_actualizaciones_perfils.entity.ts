import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'registro_actualizaciones_perfils' })
export class RegistroActualizacionesPerfilsEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'cliente_id', type: 'bigint', unsigned: true })
  cliente_id!: string;

  @Column({ name: 'comentario', type: 'varchar', length: 255, nullable: true })
  comentario!: string | null;

  @Column({ name: 'url_doc', type: 'varchar', length: 255 })
  url_doc!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true })
  user_id!: string | null;

  @Column({ name: 'forma_actualizado', type: 'enum', enum: ['Online', 'Tilk'] })
  forma_actualizado!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
