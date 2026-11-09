import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'vitaes' })
export class VitaesEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'identidad', type: 'varchar', length: 16 })
  identidad!: string;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 80 })
  nombre_completo!: string;

  @Column({ name: 'interesado_en', type: 'varchar', length: 50 })
  interesado_en!: string;

  @Column({ name: 'puesto', type: 'varchar', length: 80 })
  puesto!: string;

  @Column({ name: 'domicilio', type: 'varchar', length: 255 })
  domicilio!: string;

  @Column({ name: 'telefono', type: 'varchar', length: 12 })
  telefono!: string;

  @Column({ name: 'email', type: 'varchar', length: 80 })
  email!: string;

  @Column({ name: 'ultimo_trabajo', type: 'varchar', length: 50, nullable: true })
  ultimo_trabajo!: string | null;

  @Column({ name: 'file', type: 'varchar', length: 255, nullable: true })
  file!: string | null;

  @Column({ name: 'is_trabaja', type: 'varchar', length: 3 })
  is_trabaja!: string;

  @Column({ name: 'comentario', type: 'varchar', length: 255, nullable: true })
  comentario!: string | null;

  @Column({ name: 'comentario_rrhh', type: 'text', nullable: true })
  comentario_rrhh!: string | null;

  @Column({ name: 'estado', type: 'enum', enum: ['NUEVO', 'REVISADO', 'DESCARTADO', 'PROCESO CONTRATACION', 'PARA RREVISION FUTURA', 'CONTRATADO'], default: 'NUEVO' })
  estado!: 'NUEVO' | 'REVISADO' | 'DESCARTADO' | 'PROCESO CONTRATACION' | 'PARA RREVISION FUTURA' | 'CONTRATADO';

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
