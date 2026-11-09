import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "colonias" })
export class Colonias {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: "60" })
  nombre!: string;

  @Column({ name: "ciudade_id", type: "bigint", unsigned: true })
  ciudade_id!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;

  @Column({ name: "lat", type: "decimal", precision: 10, scale: 7, nullable: true })
  lat!: string | null;

  @Column({ name: "lon", type: "decimal", precision: 10, scale: 7, nullable: true })
  lon!: string | null;
}
