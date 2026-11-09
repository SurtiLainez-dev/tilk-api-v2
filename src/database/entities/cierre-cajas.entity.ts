import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "cierre_cajas" })
export class CierreCajas {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "cajas_id", type: "bigint", unsigned: true })
  cajas_id!: string;

  @Column({ name: "resumen_fp", type: "json", nullable: true })
  resumen_fp!: unknown | null;

  @Column({ name: "resumen", type: "json", nullable: true })
  resumen!: unknown | null;

  @Column({ name: "total", type: "double", precision: 9, scale: 2, default: "0.00" })
  total!: number;

  @Column({ name: "ingreso", type: "double", precision: 9, scale: 2, default: "0.00" })
  ingreso!: number;

  @Column({ name: "egreso", type: "double", precision: 9, scale: 2, default: "0.00" })
  egreso!: number;

  @Column({ name: "efectivo", type: "double", precision: 9, scale: 2, default: "0.00" })
  efectivo!: number;

  @Column({ name: "efectivo_declarado", type: "double", precision: 9, scale: 2, default: "0.00" })
  efectivo_declarado!: number;

  @Column({ name: "descuadre", type: "double", precision: 9, scale: 2, default: "0.00" })
  descuadre!: number;

  @Column({ name: "file", type: "varchar", length: "255", nullable: true })
  file!: string | null;

  @Column({ name: "fecha", type: "date" })
  fecha!: string;

  @Column({ name: "observacion", type: "varchar", length: "200", nullable: true })
  observacion!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;

  @Column({ name: "revisado", type: "tinyint", nullable: true })
  revisado!: number | null;

  @Column({ name: "comentario_revision", type: "text", nullable: true })
  comentario_revision!: string | null;

  @Column({ name: "total_acumulado_h", type: "double", precision: 9, scale: 2, default: "0.00", comment: "Es el total que declaro en efectivo, y este campo no se editara en el futuro" })
  total_acumulado_h!: number;

  @Column({ name: "total_acumulado", type: "double", precision: 9, scale: 2, default: "0.00", comment: "Es el total que se declara en efectivo" })
  total_acumulado!: number;

  @Column({ name: "user_id", type: "bigint", unsigned: true, nullable: true })
  user_id!: string | null;
}
