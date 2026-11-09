import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "ficha_garantia_archivos" })
export class FichaGarantiaArchivos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "ficha_garantia_id", type: "bigint", unsigned: true })
  ficha_garantia_id!: string;

  @Column({ name: "comentario_id", type: "bigint", unsigned: true, nullable: true })
  comentario_id?: string | null;

  @Column({ name: "nombre_original", type: "varchar", length: 255 })
  nombre_original!: string;

  @Column({ name: "url", type: "varchar", length: 1000 })
  url!: string;

  @Column({ name: "mime_type", type: "varchar", length: 100, nullable: true })
  mime_type?: string | null;

  @Column({ name: "tipo", type: "varchar", length: 20, nullable: true })
  tipo?: string | null;

  @Column({ name: "is_publico", type: "tinyint", default: 0 })
  is_publico!: number;

  @Column({ name: "size_bytes", type: "bigint", unsigned: true, nullable: true })
  size_bytes?: string | null;

  @Column({ name: "user_id", type: "bigint", unsigned: true, nullable: true })
  user_id?: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
