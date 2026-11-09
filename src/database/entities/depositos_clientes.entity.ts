import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "depositos_clientes" })
export class DepositosClientes {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "caja_id", type: "bigint", unsigned: true })
  caja_id!: string;

  @Column({ name: "venta_id", type: "bigint", unsigned: true })
  venta_id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "fecha_deposito", type: "date" })
  fecha_deposito!: Date;

  @Column({ name: "fecha_revisado", type: "date", nullable: true })
  fecha_revisado?: Date | null;

  @Column({ name: "monto", type: "double", precision: 9, scale: 2 })
  monto!: number;

  @Column({ name: "monto_actual", type: "double", precision: 9, scale: 2 })
  monto_actual!: number;

  @Column({ name: "pagos_editados", type: "json", nullable: true })
  pagos_editados?: unknown | null;

  @Column({ name: "referencia", type: "varchar", length: 100 })
  referencia!: string;

  @Column({ name: "observacion", type: "varchar", length: 255, nullable: true })
  observacion?: string | null;

  @Column({ name: "file", type: "varchar", length: 255 })
  file!: string;

  @Column({ name: "estado", type: "tinyint" })
  estado!: number;

  @Column({ name: "usuario_valido", type: "bigint", unsigned: true, nullable: true })
  usuario_valido?: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
