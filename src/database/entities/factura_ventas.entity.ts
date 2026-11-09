import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "factura_ventas" })
export class FacturaVentas {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "directrices__impresion_id", type: "bigint", unsigned: true })
  directrices__impresion_id!: string;

  @Column({ name: "venta_id", type: "bigint", unsigned: true })
  venta_id!: string;

  @Column({ name: "sucursal_id", type: "bigint", unsigned: true })
  sucursal_id!: string;

  @Column({ name: "caja_id", type: "bigint", unsigned: true })
  caja_id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "fecha", type: "date" })
  fecha!: Date;

  @Column({ name: "hora", type: "time" })
  hora!: string;

  @Column({ name: "cuerpo", type: "json" })
  cuerpo!: unknown;

  @Column({ name: "contador", type: "varchar", length: 40 })
  contador!: string;

  @Column({ name: "sub_total", type: "double", precision: 9, scale: 2 })
  sub_total!: number;

  @Column({ name: "impuesto", type: "double", precision: 9, scale: 2 })
  impuesto!: number;

  @Column({ name: "total", type: "double", precision: 9, scale: 2 })
  total!: number;

  @Column({ name: "efectivo", type: "double", precision: 9, scale: 2 })
  efectivo!: number;

  @Column({ name: "cambio", type: "double", precision: 9, scale: 2 })
  cambio!: number;

  @Column({ name: "total_string", type: "varchar", length: 150 })
  total_string!: string;

  @Column({ name: "estado", type: "tinyint" })
  estado!: number;

  @Column({ name: "file", type: "varchar", length: 255, nullable: true })
  file?: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;

  @Column({ name: "descuento", type: "double", precision: 9, scale: 2, default: 0.00 })
  descuento!: number;
}
