import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuerpo_factura_proveedors' })
export class CuerpoFacturaProveedors {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "factura_proveedor_id", type: "bigint", unsigned: true })
  factura_proveedor_id!: string;

  @Column({ name: "articulo_id", type: "bigint", unsigned: true })
  articulo_id!: string;

  @Column({ name: "cantidad", type: "int" })
  cantidad!: number;

  @Column({ name: "precio_unitario", type: "double", precision: 9, scale: 2 })
  precio_unitario!: number;

  @Column({ name: "sub_total", type: "double", precision: 9, scale: 2 })
  sub_total!: number;

  @Column({ name: "impuesto_id", type: "bigint", unsigned: true })
  impuesto_id!: string;

  @Column({ name: "total", type: "double", precision: 9, scale: 2 })
  total!: number;

  @Column({ name: "observacion", type: "varchar", length: 400, nullable: true })
  observacion!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

  @Column({ name: "descuento", type: "double", precision: 9, scale: 2, nullable: true })
  descuento!: number | null;

}
