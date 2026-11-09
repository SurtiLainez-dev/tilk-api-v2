import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("memo_tipo_documentos")
export class MemoTipoDocumentos {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  nombre!: string;

  @Column({ type: 'varchar', length: 3 })
  cod!: string;

  @Column({ type: 'text' })
  explicacion!: string;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
