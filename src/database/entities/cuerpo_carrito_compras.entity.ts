import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuerpo_carrito_compras' })
export class CuerpoCarritoCompras {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "carrito_compra_id", type: "bigint", unsigned: true, comment: "Carrito al que pertenece esta línea" })
  carrito_compra_id!: string;

  @Column({ name: "articulo_id", type: "bigint", unsigned: true, comment: "Artículo agregado al carrito" })
  articulo_id!: string;

  @Column({ name: "tk2_precio_id", type: "bigint", unsigned: true, nullable: true, comment: "Precio base seleccionado al momento de agregar el artículo" })
  tk2_precio_id!: string | null;

  @Column({ name: "tk2_precio_plan_id", type: "bigint", unsigned: true, nullable: true, comment: "Plan de precio seleccionado para esta línea, si aplica" })
  tk2_precio_plan_id!: string | null;

  @Column({ name: "cantidad", type: "decimal", precision: 9, scale: 2, default: 1.0, comment: "Cantidad de unidades del artículo" })
  cantidad!: string;

  @Column({ name: "precio_costo", type: "decimal", precision: 12, scale: 2, default: 0.0, comment: "Costo del artículo al momento de agregarlo" })
  precio_costo!: string;

  @Column({ name: "precio_contado", type: "decimal", precision: 12, scale: 2, default: 0.0, comment: "Precio contado activo al momento de agregarlo" })
  precio_contado!: string;

  @Column({ name: "precio_final", type: "decimal", precision: 12, scale: 2, default: 0.0, comment: "Precio final usado en esta línea, según plan seleccionado" })
  precio_final!: string;

  @Column({ name: "subtotal", type: "decimal", precision: 12, scale: 2, default: 0.0, comment: "Subtotal antes de descuentos" })
  subtotal!: string;

  @Column({ name: "descuento_monto", type: "decimal", precision: 12, scale: 2, default: 0.0, comment: "Descuento aplicado a esta línea" })
  descuento_monto!: string;

  @Column({ name: "descuento_porcentaje", type: "decimal", precision: 8, scale: 2, default: 0.0, comment: "Porcentaje de descuento aplicado a esta línea" })
  descuento_porcentaje!: string;

  @Column({ name: "total", type: "decimal", precision: 12, scale: 2, default: 0.0, comment: "Total final de esta línea después de descuentos" })
  total!: string;

  @Column({ name: "detalle_precio", type: "json", nullable: true, comment: "Copia JSON del precio base usado al momento de agregar" })
  detalle_precio!: unknown | null;

  @Column({ name: "detalle_plan", type: "json", nullable: true, comment: "Copia JSON del plan seleccionado al momento de agregar" })
  detalle_plan!: unknown | null;

  @Column({ name: "es_regalia", type: "tinyint", default: 0, comment: "Indica si esta línea es una regalía" })
  es_regalia!: number;

  @Column({ name: "estado_regalia", type: "enum", enum: ["NO_APLICA", "PENDIENTE_APROBACION", "APROBADA", "RECHAZADA"], default: "NO_APLICA", comment: "Estado de aprobación si la línea es regalía" })
  estado_regalia!: 'NO_APLICA' | 'PENDIENTE_APROBACION' | 'APROBADA' | 'RECHAZADA';

  @Column({ name: "tipo_linea", type: "enum", enum: ["NORMAL", "REGALIA", "DESCUENTO_ESPECIAL"], default: "NORMAL" })
  tipo_linea!: 'NORMAL' | 'REGALIA' | 'DESCUENTO_ESPECIAL';

  @Column({ name: "unidad_numero", type: "int", nullable: true, comment: "Número de unidad cuando una cantidad se divide para crédito" })
  unidad_numero!: number | null;

  @Column({ name: "estado_credito", type: "enum", enum: ["NO_APLICA", "SIN_PLAN", "CON_PLAN"], default: "NO_APLICA" })
  estado_credito!: 'NO_APLICA' | 'SIN_PLAN' | 'CON_PLAN';

  @Column({ name: "frecuencia_pago_aplicada", type: "enum", enum: ["SEMANAL", "QUINCENAL", "MENSUAL"], nullable: true })
  frecuencia_pago_aplicada!: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | null;

  @Column({ name: "plazo_meses_aplicado", type: "int", default: 0 })
  plazo_meses_aplicado!: number;

  @Column({ name: "cantidad_cuotas_aplicada", type: "int", default: 0 })
  cantidad_cuotas_aplicada!: number;

  @Column({ name: "tasa_interes_aplicada", type: "decimal", precision: 8, scale: 2, default: 0.0 })
  tasa_interes_aplicada!: string;

  @Column({ name: "prima_aplicada", type: "decimal", precision: 12, scale: 2, default: 0.0 })
  prima_aplicada!: string;

  @Column({ name: "monto_financiado", type: "decimal", precision: 12, scale: 2, default: 0.0 })
  monto_financiado!: string;

  @Column({ name: "cuota_calculada", type: "decimal", precision: 12, scale: 2, default: 0.0 })
  cuota_calculada!: string;

  @Column({ name: "total_credito_linea", type: "decimal", precision: 12, scale: 2, default: 0.0 })
  total_credito_linea!: string;

  @Column({ name: "preview_cuotas", type: "json", nullable: true, comment: "Preview de cuotas generado para esta línea" })
  preview_cuotas!: unknown | null;

  @Column({ name: "comentario", type: "text", nullable: true, comment: "Comentario interno sobre esta línea del carrito" })
  comentario!: string | null;

  @Column({ name: "estado", type: "tinyint", default: 1, comment: "Indica si esta línea sigue activa dentro del carrito" })
  estado!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
