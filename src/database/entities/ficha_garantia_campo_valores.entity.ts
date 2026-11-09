import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "ficha_garantia_campo_valores" })
export class FichaGarantiaCampoValores {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "ficha_garantia_id", type: "bigint", unsigned: true })
  ficha_garantia_id!: string;

  @Column({ name: "campo_id", type: "bigint", unsigned: true })
  campo_id!: string;

  @Column({ name: "valor", type: "text", nullable: true })
  valor?: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
