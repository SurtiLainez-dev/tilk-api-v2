import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "estado_cuentas" })
export class EstadoCuentas {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "venta_id", type: "bigint", unsigned: true })
  venta_id!: string;

  @Column({ name: "tipo", type: "enum", enum: ["CRÉDITO", "DÉBITO"] })
  tipo!: "CRÉDITO" | "DÉBITO";

  @Column({ name: "monto", type: "decimal", precision: 12, scale: 2 })
  monto!: string;

  @Column({ name: "saldo", type: "decimal", precision: 12, scale: 2 })
  saldo!: string;

  @Column({ name: "origen", type: "enum", enum: ["APERTURA", "MORA", "ABONO", "AJUSTE", "DESCUENTO", "CONDONACIÓN", "REVERSIÓN", "DEDUCCIÓN_PLANILLA", "DEDUCCIÓN_MANUAL", "REFINANCIAMIENTO"], nullable: true })
  origen?: "APERTURA" | "MORA" | "ABONO" | "AJUSTE" | "DESCUENTO" | "CONDONACIÓN" | "REVERSIÓN" | "DEDUCCIÓN_PLANILLA" | "DEDUCCIÓN_MANUAL" | "REFINANCIAMIENTO" | null;

  @Column({ name: "referencia", type: "varchar", length: 50, nullable: true })
  referencia?: string | null;

  @Column({ name: "detalle", type: "text" })
  detalle!: string;

  @Column({ name: "run_id", type: "bigint", unsigned: true, nullable: true })
  run_id?: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
