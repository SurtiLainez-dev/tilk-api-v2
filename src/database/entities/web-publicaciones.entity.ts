import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'web_publicaciones' })
export class WebPublicacionesEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'titulo', type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ name: 'slug', type: 'varchar', length: 255 })
  slug!: string;

  @Column({ name: 'resumen', type: 'text', nullable: true })
  resumen!: string | null;

  @Column({ name: 'contenido', type: 'longtext' })
  contenido!: string;

  @Column({ name: 'imagen_portada', type: 'varchar', length: 255, nullable: true })
  imagen_portada!: string | null;

  @Column({ name: 'autor_id', type: 'bigint', unsigned: true, nullable: true })
  autor_id!: string | null;

  @Column({ name: 'tipo', type: 'enum', enum: ['NOTICIA', 'PROMOCION', 'INFORMATIVO', 'EVENTO'], default: 'NOTICIA' })
  tipo!: 'NOTICIA' | 'PROMOCION' | 'INFORMATIVO' | 'EVENTO';

  @Column({ name: 'estado', type: 'enum', enum: ['BORRADOR', 'PUBLICADO', 'OCULTO'], default: 'BORRADOR' })
  estado!: 'BORRADOR' | 'PUBLICADO' | 'OCULTO';

  @Column({ name: 'destacado', type: 'tinyint', default: 0 })
  destacado!: number;

  @Column({ name: 'lecturas', type: 'bigint', unsigned: true, default: 0 })
  lecturas!: string;

  @Column({ name: 'likes', type: 'bigint', unsigned: true, default: 0 })
  likes!: string;

  @Column({ name: 'dislikes', type: 'bigint', unsigned: true, default: 0 })
  dislikes!: string;

  @Column({ name: 'fecha_publicacion', type: 'timestamp', nullable: true })
  fecha_publicacion!: Date | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
