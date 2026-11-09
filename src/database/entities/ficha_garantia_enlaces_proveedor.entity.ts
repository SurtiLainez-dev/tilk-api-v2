import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "ficha_garantia_enlaces_proveedor" })
export class FichaGarantiaEnlacesProveedor {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "ficha_garantia_id", type: "bigint", unsigned: true })
  ficha_garantia_id!: string;

  @Column({ name: "proveedor_id", type: "bigint", unsigned: true })
  proveedor_id!: string;

  @Column({ name: "creado_por", type: "bigint", unsigned: true })
  creado_por!: string;

  @Column({ name: "token_hash", type: "varchar", length: 64 })
  token_hash!: string;

  @Column({ name: "pin_hash", type: "varchar", length: 255 })
  pin_hash!: string;

  @Column({ name: "expires_at", type: "timestamp" })
  expires_at!: Date;

  @Column({ name: "revocado_at", type: "timestamp", nullable: true })
  revocado_at?: Date | null;

  @Column({ name: "ultimo_acceso_at", type: "timestamp", nullable: true })
  ultimo_acceso_at?: Date | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
