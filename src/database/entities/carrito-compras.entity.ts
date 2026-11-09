import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "carrito_compras" })
export class CarritoCompras {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "slug", type: "varchar", length: "80", comment: "Identificador público único del carrito" })
  slug!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true, comment: "Usuario/vendedor que creó el carrito" })
  user_id!: string;

  @Column({ name: "cliente_id", type: "bigint", unsigned: true, comment: "Cliente dueño del carrito" })
  cliente_id!: string;

  @Column({ name: "sucursal_id", type: "bigint", unsigned: true, comment: "Sucursal donde se originó el carrito" })
  sucursal_id!: string;

  @Column({ name: "nombre", type: "text", comment: "Nombre interno del carrito o solicitud" })
  nombre!: string;

  @Column({ name: "estado", type: "enum", enum: ["ABIERTO", "EN_SOLICITUD", "APROBADO", "RECHAZADO", "CONVERTIDO_VENTA", "CANCELADO"], default: "ABIERTO" })
  estado!: string;

  @Column({ name: "tipo", type: "enum", enum: ["CREDITO", "CONTADO"], default: "CREDITO" })
  tipo!: string;

  @Column({ name: "origen", type: "enum", enum: ["VENDEDOR", "CLIENTE_PORTAL"], default: "VENDEDOR", comment: "Indica si fue creado por un vendedor o por el portal del cliente" })
  origen!: string;

  @Column({ name: "subtotal", type: "decimal", precision: 12, scale: 2, default: "0.00", comment: "Subtotal antes de descuentos" })
  subtotal!: string;

  @Column({ name: "descuento", type: "decimal", precision: 12, scale: 2, default: "0.00", comment: "Descuento total aplicado" })
  descuento!: string;

  @Column({ name: "total_neto", type: "decimal", precision: 12, scale: 2, default: "0.00", comment: "Total después de descuentos" })
  total_neto!: string;

  @Column({ name: "prima_total", type: "decimal", precision: 12, scale: 2, default: "0.00", comment: "Prima total requerida" })
  prima_total!: string;

  @Column({ name: "total_financiar", type: "decimal", precision: 12, scale: 2, default: "0.00", comment: "Monto total a financiar" })
  total_financiar!: string;

  @Column({ name: "cuota_total", type: "decimal", precision: 12, scale: 2, default: "0.00", comment: "Valor aproximado de cuota global" })
  cuota_total!: string;

  @Column({ name: "total_credito", type: "decimal", precision: 12, scale: 2, default: "0.00", comment: "Total general del crédito incluyendo intereses" })
  total_credito!: string;

  @Column({ name: "plazo_meses", type: "int", default: "0", comment: "Plazo general del carrito" })
  plazo_meses!: number;

  @Column({ name: "cantidad_cuotas", type: "int", default: "0", comment: "Cantidad total de cuotas" })
  cantidad_cuotas!: number;

  @Column({ name: "tasa_interes_anual", type: "decimal", precision: 8, scale: 2, default: "0.00", comment: "Tasa anual utilizada" })
  tasa_interes_anual!: string;

  @Column({ name: "frecuencia_pago", type: "enum", enum: ["SEMANAL", "QUINCENAL", "MENSUAL"], nullable: true })
  frecuencia_pago!: string | null;

  @Column({ name: "comentario", type: "text", nullable: true })
  comentario!: string | null;

  @Column({ name: "estado_visible", type: "tinyint", default: "1", comment: "Indica si el carrito sigue visible para el usuario" })
  estado_visible!: number;

  @Column({ name: "fecha_solicitud", type: "timestamp", nullable: true })
  fecha_solicitud!: Date | null;

  @Column({ name: "fecha_aprobacion", type: "timestamp", nullable: true })
  fecha_aprobacion!: Date | null;

  @Column({ name: "fecha_rechazo", type: "timestamp", nullable: true })
  fecha_rechazo!: Date | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;
}
