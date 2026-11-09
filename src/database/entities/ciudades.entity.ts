import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "ciudades" })
export class Ciudades {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "nombres", type: "varchar", length: "60" })
  nombres!: string;

  @Column({ name: "municipio_id", type: "bigint", unsigned: true })
  municipio_id!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;

  @Column({ name: "tipo", type: "varchar", length: "8", nullable: true })
  tipo!: string | null;

  @Column({ name: "lat", type: "decimal", precision: 10, scale: 7, nullable: true })
  lat!: string | null;

  @Column({ name: "lon", type: "decimal", precision: 10, scale: 7, nullable: true })
  lon!: string | null;

  @Column({ name: "cod", type: "varchar", length: "4", nullable: true, default: "0" })
  cod!: string | null;
}
