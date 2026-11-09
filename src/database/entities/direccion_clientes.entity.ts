import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "direccion_clientes" })
export class DireccionClientes {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "colonia_id", type: "bigint", unsigned: true })
  colonia_id!: string;

  @Column({ name: "cliente_id", type: "bigint", unsigned: true })
  cliente_id!: string;

  @Column({ name: "detalle", type: "varchar", length: 600 })
  detalle!: string;

  @Column({ name: "estado", type: "tinyint" })
  estado!: number;

  @Column({ name: "lat", type: "decimal", precision: 10, scale: 7, nullable: true })
  lat?: string | null;

  @Column({ name: "lon", type: "decimal", precision: 10, scale: 7, nullable: true })
  lon?: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;

  @Column({ name: "token_id", type: "bigint", unsigned: true, nullable: true })
  token_id?: string | null;
}
