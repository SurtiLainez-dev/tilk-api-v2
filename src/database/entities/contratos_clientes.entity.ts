import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'contratos_clientes' })
export class ContratosClientes {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "venta_id", type: "bigint", unsigned: true })
  venta_id!: string;

  @Column({ name: "saldo_abonado", type: "double", precision: 9, scale: 2 })
  saldo_abonado!: number;

  @Column({ name: "saldo_mora", type: "double", precision: 9, scale: 2 })
  saldo_mora!: number;

  @Column({ name: "tasa", type: "double", precision: 5, scale: 2 })
  tasa!: number;

  @Column({ name: "cuota", type: "double" })
  cuota!: number;

  @Column({ name: "forma_pago", type: "int" })
  forma_pago!: number;

  @Column({ name: "fecha_vencimiento", type: "date" })
  fecha_vencimiento!: string;

  @Column({ name: "cod_contrato", type: "varchar", length: 255 })
  cod_contrato!: string;

  @Column({ name: "prima", type: "double", comment: "Es la prima del contrato" })
  prima!: number;

  @Column({ name: "fecha_prima", type: "date", comment: "Fecha de la prima" })
  fecha_prima!: string;

  @Column({ name: "saldo_financiar", type: "double", comment: "Es el saldo a financiar del contrato" })
  saldo_financiar!: number;

  @Column({ name: "observaciones", type: "json", nullable: true })
  observaciones!: unknown | null;

  @Column({ name: "porcentaje_documentos", type: "int" })
  porcentaje_documentos!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

  @Column({ name: "remision_articulo_id", type: "bigint", unsigned: true, nullable: true })
  remision_articulo_id!: string | null;

  @Column({ name: "dias_mora", type: "int", nullable: true, default: 0 })
  dias_mora!: number | null;

}
