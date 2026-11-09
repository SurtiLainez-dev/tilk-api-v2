import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("memo_documentos")
export class MemoDocumentos {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true, comment: "usuario creador" })
  user_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  memo_tipo_documento_id!: string;

  @Column({ type: 'varchar', length: 12 })
  codigo!: string;

  @Column({ type: 'json', comment: "usuarios a los que va dirigidos" })
  usuarios!: unknown;

  @Column({ type: 'varchar', length: 200 })
  asunto!: string;

  @Column({ type: 'text' })
  contenido!: string;

  @Column({ type: 'json', comment: "documentos cargados" })
  url_documento!: unknown;

  @Column({ type: 'int', comment: "0: creado - 1: cargado por usuarios" })
  estado!: number;

  @Column({ type: 'int', comment: "0: file a cada usuario - 1: un solo documento" })
  grupal!: number;

  @Column({ type: 'json', nullable: true, comment: "url de documentos" })
  urls?: unknown | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
