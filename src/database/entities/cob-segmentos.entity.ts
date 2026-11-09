import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "cob_segmentos" })
export class CobSegmentos {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: "50" })
  nombre!: string;

  @Column({ name: "alias", type: "varchar", length: "25" })
  alias!: string;

  @Column({ name: "inicio", type: "int" })
  inicio!: number;

  @Column({ name: "final", type: "int" })
  final!: number;

  @Column({ name: "color", type: "varchar", length: "10" })
  color!: string;

  @Column({ name: "explicacion", type: "text", comment: "Describe cual es la funcion del segmento" })
  explicacion!: string;

  @Column({ name: "funciones", type: "json" })
  funciones!: unknown;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;
}
