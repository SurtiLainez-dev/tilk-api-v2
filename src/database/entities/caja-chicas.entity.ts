import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "caja_chicas" })
export class CajaChicas {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: "50" })
  nombre!: string;

  @Column({ name: "descripcion", type: "varchar", length: "100", nullable: true })
  descripcion!: string | null;

  @Column({ name: "sucursal_id", type: "bigint", unsigned: true })
  sucursal_id!: string;

  @Column({ name: "total_inicial", type: "double", precision: 10, scale: 2, nullable: true })
  total_inicial!: number | null;

  @Column({ name: "total_actual", type: "double", precision: 10, scale: 2, nullable: true })
  total_actual!: number | null;

  @Column({ name: "fecha_asignacion", type: "date", nullable: true })
  fecha_asignacion!: string | null;

  @Column({ name: "fecha_finalizacion", type: "date", nullable: true })
  fecha_finalizacion!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;
}
