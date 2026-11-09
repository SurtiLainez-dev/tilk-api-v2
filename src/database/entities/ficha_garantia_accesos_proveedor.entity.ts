import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "ficha_garantia_accesos_proveedor" })
export class FichaGarantiaAccesosProveedor {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "enlace_id", type: "bigint", unsigned: true, nullable: true })
  enlace_id?: string | null;

  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ip_address?: string | null;

  @Column({ name: "user_agent", type: "text", nullable: true })
  user_agent?: string | null;

  @Column({ name: "dispositivo", type: "varchar", length: 30, nullable: true })
  dispositivo?: string | null;

  @Column({ name: "navegador", type: "varchar", length: 60, nullable: true })
  navegador?: string | null;

  @Column({ name: "sistema_operativo", type: "varchar", length: 60, nullable: true })
  sistema_operativo?: string | null;

  @Column({ name: "resultado", type: "varchar", length: 40 })
  resultado!: string;

  @Column({ name: "accion", type: "varchar", length: 50 })
  accion!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
