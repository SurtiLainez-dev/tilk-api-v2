import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuenta_banco_proveedors' })
export class CuentaBancoProveedors {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "banco_id", type: "bigint", unsigned: true })
  banco_id!: string;

  @Column({ name: "proveedor_id", type: "bigint", unsigned: true, nullable: true })
  proveedor_id!: string | null;

  @Column({ name: "num", type: "varchar", length: 150 })
  num!: string;

  @Column({ name: "estado", type: "tinyint" })
  estado!: number;

  @Column({ name: "total_transferido", type: "double", nullable: true })
  total_transferido!: number | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

  @Column({ name: "acreedor_id", type: "bigint", unsigned: true, nullable: true })
  acreedor_id!: string | null;

}
