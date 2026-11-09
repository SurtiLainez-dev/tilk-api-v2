import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'componentes_transferencias' })
export class ComponentesTransferencias {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "cuerpo_transferencia_id", type: "bigint", unsigned: true })
  cuerpo_transferencia_id!: string;

  @Column({ name: "articulo_compuesto_id", type: "bigint", unsigned: true })
  articulo_compuesto_id!: string;

  @Column({ name: "cantidad", type: "int" })
  cantidad!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

  @Column({ name: "cantidad_recibida", type: "int", nullable: true })
  cantidad_recibida!: number | null;

}
