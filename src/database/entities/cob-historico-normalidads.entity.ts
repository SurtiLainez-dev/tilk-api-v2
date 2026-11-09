import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "cob_historico_normalidads" })
export class CobHistoricoNormalidads {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "cob_portafolio_id", type: "bigint", unsigned: true })
  cob_portafolio_id!: string;

  @Column({ name: "normalidad", type: "double", precision: 4, scale: 2 })
  normalidad!: number;

  @Column({ name: "cant_cuentas", type: "int" })
  cant_cuentas!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;
}
