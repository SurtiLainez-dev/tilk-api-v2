import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "ficha_garantia_subidas" })
export class FichaGarantiaSubidas {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "ficha_garantia_id", type: "bigint", unsigned: true })
  ficha_garantia_id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "nombre_original", type: "varchar", length: 255 })
  nombre_original!: string;

  @Column({ name: "mime_type", type: "varchar", length: 100 })
  mime_type!: string;

  @Column({ name: "size_bytes", type: "bigint", unsigned: true })
  size_bytes!: string;

  @Column({ name: "s3_key", type: "varchar", length: 700 })
  s3_key!: string;

  @Column({ name: "upload_id", type: "varchar", length: 500 })
  upload_id!: string;

  @Column({ name: "estado", type: "varchar", length: 20, default: "iniciada" })
  estado!: string;

  @Column({ name: "archivo_id", type: "bigint", unsigned: true, nullable: true })
  archivo_id?: string | null;

  @Column({ name: "expires_at", type: "timestamp", nullable: true })
  expires_at?: Date | null;

  @Column({ name: "completed_at", type: "timestamp", nullable: true })
  completed_at?: Date | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
