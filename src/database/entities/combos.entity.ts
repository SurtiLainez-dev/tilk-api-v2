import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "combos" })
export class Combos {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: "50" })
  nombre!: string;

  @Column({ name: "detalle", type: "varchar", length: "255", nullable: true })
  detalle!: string | null;

  @Column({ name: "codigo", type: "varchar", length: "15" })
  codigo!: string;

  @Column({ name: "fecha_inicio", type: "date" })
  fecha_inicio!: string;

  @Column({ name: "fecha_final", type: "date" })
  fecha_final!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "sucursales", type: "json" })
  sucursales!: unknown;

  @Column({ name: "historial", type: "json", nullable: true })
  historial!: unknown | null;

  @Column({ name: "total_precio_contado", type: "double", precision: 9, scale: 2, nullable: true })
  total_precio_contado!: number | null;

  @Column({ name: "precio_contado", type: "double", precision: 9, scale: 2, nullable: true })
  precio_contado!: number | null;

  @Column({ name: "precio_costo", type: "double", precision: 9, scale: 2, nullable: true })
  precio_costo!: number | null;

  @Column({ name: "mejor_precio", type: "double", precision: 9, scale: 2 })
  mejor_precio!: number;

  @Column({ name: "minimo_prima", type: "double", precision: 9, scale: 2, nullable: true })
  minimo_prima!: number | null;

  @Column({ name: "margen_ganancia", type: "double", precision: 9, scale: 4, nullable: true })
  margen_ganancia!: number | null;

  @Column({ name: "financiamiento_anual", type: "double", precision: 6, scale: 2, nullable: true })
  financiamiento_anual!: number | null;

  @Column({ name: "descuento", type: "double", precision: 9, scale: 3, nullable: true })
  descuento!: number | null;

  @Column({ name: "impuesto_id", type: "bigint", unsigned: true })
  impuesto_id!: string;

  @Column({ name: "venta_sin_prima", type: "tinyint", default: "0", comment: "sirve para identificar si se puede vender sin prima" })
  venta_sin_prima!: number;

  @Column({ name: "maximo_financiacion", type: "int", default: "24", comment: "Es la cantidad maxima que tiene para financiar" })
  maximo_financiacion!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;

  @Column({ name: "sub_familia_articulo_id", type: "bigint", unsigned: true })
  sub_familia_articulo_id!: string;

  @Column({ name: "maximo_cant_usadas", type: "int" })
  maximo_cant_usadas!: number;

  @Column({ name: "cant_usadas", type: "int", default: "0" })
  cant_usadas!: number;
}
