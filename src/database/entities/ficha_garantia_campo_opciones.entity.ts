import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "ficha_garantia_campo_opciones" })
export class FichaGarantiaCampoOpciones {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "campo_id", type: "bigint", unsigned: true })
  campo_id!: string;

  @Column({ name: "etiqueta", type: "varchar", length: 150 })
  etiqueta!: string;

  @Column({ name: "valor", type: "varchar", length: 150 })
  valor!: string;

  @Column({ name: "orden", type: "int", unsigned: true, default: 0 })
  orden!: number;

  @Column({ name: "activo", type: "tinyint", default: 1 })
  activo!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
