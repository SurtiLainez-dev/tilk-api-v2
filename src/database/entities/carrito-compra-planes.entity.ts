import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "carrito_compra_planes" })
export class CarritoCompraPlanes {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "carrito_compra_id", type: "bigint", unsigned: true })
  carrito_compra_id!: string;

  @Column({ name: "cuerpo_carrito_compra_id", type: "bigint", unsigned: true })
  cuerpo_carrito_compra_id!: string;

  @Column({ name: "articulo_id", type: "bigint", unsigned: true })
  articulo_id!: string;

  @Column({ name: "tk2_precio_plan_id", type: "bigint", unsigned: true, nullable: true })
  tk2_precio_plan_id!: string | null;

  @Column({ name: "nombre_plan", type: "varchar", length: "150", nullable: true })
  nombre_plan!: string | null;

  @Column({ name: "tipo_venta", type: "enum", enum: ["CONTADO", "CONTADO_CUOTAS", "CREDITO", "OFERTA", "ONLINE"], nullable: true })
  tipo_venta!: string | null;

  @Column({ name: "tipo_calculo", type: "enum", enum: ["FIJO", "PORCENTAJE_CONTADO", "SIN_INTERES", "INTERES_SIMPLE", "INTERES_COMPUESTO", "CUOTA_NIVELADA", "PROMOCION_CONTADO"], nullable: true })
  tipo_calculo!: string | null;

  @Column({ name: "prima_sugerida", type: "decimal", precision: 12, scale: 2, default: "0.00" })
  prima_sugerida!: string;

  @Column({ name: "prima_cliente", type: "decimal", precision: 12, scale: 2, default: "0.00" })
  prima_cliente!: string;

  @Column({ name: "saldo_financiar", type: "decimal", precision: 12, scale: 2, default: "0.00" })
  saldo_financiar!: string;

  @Column({ name: "plazo_meses", type: "int", default: "0" })
  plazo_meses!: number;

  @Column({ name: "cant_meses", type: "int", default: "0" })
  cant_meses!: number;

  @Column({ name: "periodo_pago", type: "enum", enum: ["CONTADO", "SEMANAL", "QUINCENAL", "MENSUAL"], default: "MENSUAL" })
  periodo_pago!: string;

  @Column({ name: "cantidad_cuotas", type: "int", default: "0" })
  cantidad_cuotas!: number;

  @Column({ name: "cuota", type: "decimal", precision: 12, scale: 2, default: "0.00" })
  cuota!: string;

  @Column({ name: "interes_total", type: "decimal", precision: 12, scale: 2, default: "0.00" })
  interes_total!: string;

  @Column({ name: "tasa_interes_anual", type: "decimal", precision: 8, scale: 2, default: "0.00" })
  tasa_interes_anual!: string;

  @Column({ name: "total_credito", type: "decimal", precision: 12, scale: 2, default: "0.00" })
  total_credito!: string;

  @Column({ name: "detalle_plan", type: "json", nullable: true })
  detalle_plan!: unknown | null;

  @Column({ name: "estado", type: "tinyint", default: "1" })
  estado!: number;

  @Column({ name: "fecha_desactivado", type: "timestamp", nullable: true })
  fecha_desactivado!: Date | null;

  @Column({ name: "user_id", type: "bigint", unsigned: true, nullable: true })
  user_id!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;
}
