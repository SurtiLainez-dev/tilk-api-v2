import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "ficha_garantia_sesiones_proveedor" })
export class FichaGarantiaSesionesProveedor {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "enlace_id", type: "bigint", unsigned: true })
  enlace_id!: string;

  @Column({ name: "token_hash", type: "varchar", length: 64 })
  token_hash!: string;

  @Column({ name: "expires_at", type: "timestamp" })
  expires_at!: Date;

  @Column({ name: "revocado_at", type: "timestamp", nullable: true })
  revocado_at?: Date | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
