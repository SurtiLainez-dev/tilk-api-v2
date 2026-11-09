import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "cob_registro_abono_segmentos" })
export class CobRegistroAbonoSegmentos {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "cob_segmento_id", type: "bigint", unsigned: true })
  cob_segmento_id!: string;

  @Column({ name: "total", type: "double", precision: 9, scale: 2 })
  total!: number;

  @Column({ name: "cob_portafolio_id", type: "bigint", unsigned: true })
  cob_portafolio_id!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;
}
