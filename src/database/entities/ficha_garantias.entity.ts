import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "ficha_garantias" })
export class FichaGarantias {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true, nullable: true })
  user_id?: string | null;

  @Column({ name: "sucursal_id", type: "bigint", unsigned: true, nullable: true })
  sucursal_id?: string | null;

  @Column({ name: "origen", type: "varchar", length: 20, default: "CLIENTE" })
  origen!: string;

  @Column({ name: "venta_id", type: "bigint", unsigned: true, nullable: true })
  venta_id?: string | null;

  @Column({ name: "factura_proveedor_id", type: "bigint", unsigned: true, nullable: true })
  factura_proveedor_id?: string | null;

  @Column({ name: "articulo_id", type: "bigint", unsigned: true, nullable: true })
  articulo_id?: string | null;

  @Column({ name: "ubicacion_articulo", type: "varchar", length: 30, nullable: true })
  ubicacion_articulo?: string | null;

  @Column({ name: "notificado_proveedor", type: "tinyint", default: 0 })
  notificado_proveedor!: number;

  @Column({ name: "notificado_proveedor_at", type: "timestamp", nullable: true })
  notificado_proveedor_at?: Date | null;

  @Column({ name: "num_nota_credito", type: "varchar", length: 100, nullable: true })
  num_nota_credito?: string | null;

  @Column({ name: "is_nota_aplicada", type: "tinyint", default: 0 })
  is_nota_aplicada!: number;

  @Column({ name: "factura_aplica_nota_id", type: "bigint", unsigned: true, nullable: true })
  factura_aplica_nota_id?: string | null;

  @Column({ name: "nota_aplicada_at", type: "timestamp", nullable: true })
  nota_aplicada_at?: Date | null;

  @Column({ name: "nota_aplicada_por", type: "bigint", unsigned: true, nullable: true })
  nota_aplicada_por?: string | null;

  @Column({ name: "estado", type: "enum", enum: ["Pendiente", "Recibido", "Procesando", "Cerrado"], default: "Pendiente" })
  estado!: "Pendiente" | "Recibido" | "Procesando" | "Cerrado";

  @Column({ name: "is_rechazado", type: "tinyint", default: 0 })
  is_rechazado!: number;

  @Column({ name: "motivo_rechazo", type: "text", nullable: true })
  motivo_rechazo?: string | null;

  @Column({ name: "rechazado_por", type: "text", nullable: true })
  rechazado_por?: string | null;

  @Column({ name: "rechazado_at", type: "timestamp", nullable: true })
  rechazado_at?: Date | null;

  @Column({ name: "comentario_cliente", type: "varchar", length: 400 })
  comentario_cliente!: string;

  @Column({ name: "comentario_inicial_usuario", type: "varchar", length: 255, nullable: true })
  comentario_inicial_usuario?: string | null;

  @Column({ name: "cod", type: "varchar", length: 15 })
  cod!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
