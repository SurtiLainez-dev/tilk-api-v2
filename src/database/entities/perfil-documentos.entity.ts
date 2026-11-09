import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'perfil_documentos' })
export class PerfilDocumentos {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'cliente_id', type: 'bigint', unsigned: true })
  cliente_id!: string;

  @Column({ name: 'url', type: 'text', nullable: true })
  url!: string | null;

  @Column({ name: 'estado', type: 'tinyint', nullable: true, default: 1 })
  estado!: number | null;

  @Column({ name: 'is_public', type: 'tinyint', default: 0 })
  is_public!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'detalle', type: 'varchar', length: 150, nullable: true })
  detalle!: string | null;

  @Column({ name: 'is_firma', type: 'tinyint', nullable: true, default: 0 })
  is_firma!: number | null;

}
