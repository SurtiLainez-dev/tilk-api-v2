import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cotizacion_creditos' })
export class CotizacionCreditos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "sucursal_id", type: "bigint", unsigned: true })
  sucursal_id!: string;

  @Column({ name: "articulo_id", type: "bigint", unsigned: true })
  articulo_id!: string;

  @Column({ name: "precio_contado", type: "double", default: 0 })
  precio_contado!: number;

  @Column({ name: "minimo_prima", type: "double", default: 0 })
  minimo_prima!: number;

  @Column({ name: "saldo", type: "double", default: 0 })
  saldo!: number;

  @Column({ name: "prima_propuesta", type: "double", default: 0 })
  prima_propuesta!: number;

  @Column({ name: "saldo_financiar", type: "double", default: 0 })
  saldo_financiar!: number;

  @Column({ name: "forma_pago", type: "int", default: 0 })
  forma_pago!: number;

  @Column({ name: "cantidad_meses", type: "int", default: 0 })
  cantidad_meses!: number;

  @Column({ name: "cuota", type: "double", default: 0 })
  cuota!: number;

  @Column({ name: "total_credito", type: "double", default: 0 })
  total_credito!: number;

  @Column({ name: "pagos", type: "json" })
  pagos!: unknown;

  @Column({ name: "venta_sin_prima", type: "tinyint", default: 0 })
  venta_sin_prima!: number;

  @Column({ name: "observacion", type: "varchar", length: 255, nullable: true })
  observacion!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
