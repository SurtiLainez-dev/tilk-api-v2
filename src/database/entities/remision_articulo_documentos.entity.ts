import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'remision_articulo_documentos' })
export class RemisionArticuloDocumentosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'remision_articulo_id', type: 'bigint', unsigned: true })
  remision_articulo_id!: string;

  @Column({ name: 'url', type: 'varchar', length: 255 })
  url!: string;

  @Column({ name: 'estado', type: 'tinyint', default: 1 })
  estado!: number;

  @Column({ name: 'detalle', type: 'varchar', length: 255, nullable: true })
  detalle!: string | null;

  @Column({ name: 'etapa', type: 'varchar', length: 30, nullable: true })
  etapa!: string | null;

  @Column({ name: 'tipo_archivo', type: 'varchar', length: 20, nullable: true })
  tipo_archivo!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
