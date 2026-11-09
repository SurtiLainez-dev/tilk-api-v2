import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "factura_proveedors" })
export class FacturaProveedors {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "orden_entrada_id", type: "bigint", unsigned: true, nullable: true })
  orden_entrada_id?: string | null;

  @Column({ name: "tipo_factura_id", type: "bigint", unsigned: true })
  tipo_factura_id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "codigo", type: "varchar", length: 15 })
  codigo!: string;

  @Column({ name: "num_factura", type: "varchar", length: 22 })
  num_factura!: string;

  @Column({ name: "fecha_facturada", type: "date" })
  fecha_facturada!: Date;

  @Column({ name: "total", type: "double", precision: 9, scale: 2 })
  total!: number;

  @Column({ name: "estado", type: "int" })
  estado!: number;

  @Column({ name: "fecha_limite_pago", type: "date" })
  fecha_limite_pago!: Date;

  @Column({ name: "fecha_inicio_pago", type: "date" })
  fecha_inicio_pago!: Date;

  @Column({ name: "file_generado", type: "varchar", length: 255, nullable: true })
  file_generado?: string | null;

  @Column({ name: "file_subir", type: "varchar", length: 255 })
  file_subir!: string;

  @Column({ name: "observacion", type: "varchar", length: 400, nullable: true })
  observacion?: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;

  @Column({ name: "total_abonado", type: "double", precision: 9, scale: 2, nullable: true })
  total_abonado?: number | null;

  @Column({ name: "proveedor_id", type: "bigint", unsigned: true, nullable: true })
  proveedor_id?: string | null;

  @Column({ name: "saldo_pendiente", type: "double", precision: 9, scale: 2, nullable: true })
  saldo_pendiente?: number | null;

  @Column({ name: "is_flete", type: "tinyint" })
  is_flete!: number;

  @Column({ name: "flete", type: "double", precision: 9, scale: 2 })
  flete!: number;

  @Column({ name: "descuento", type: "double", precision: 9, scale: 2, nullable: true })
  descuento?: number | null;
}
