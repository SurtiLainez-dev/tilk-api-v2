import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "devolucion_proveedors" })
export class DevolucionProveedors {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "fecha", type: "date", default: "2020-09-15" })
  fecha!: Date;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "orden_entrada_id", type: "bigint", unsigned: true })
  orden_entrada_id!: string;

  @Column({ name: "razon", type: "varchar", length: 255, nullable: true })
  razon?: string | null;

  @Column({ name: "cuerpo", type: "json" })
  cuerpo!: unknown;

  @Column({ name: "codigo", type: "varchar", length: 15 })
  codigo!: string;

  @Column({ name: "file_generado", type: "varchar", length: 255, nullable: true })
  file_generado?: string | null;

  @Column({ name: "file_subido", type: "varchar", length: 255, nullable: true })
  file_subido?: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;

  @Column({ name: "estado", type: "tinyint", nullable: true })
  estado?: number | null;
}
