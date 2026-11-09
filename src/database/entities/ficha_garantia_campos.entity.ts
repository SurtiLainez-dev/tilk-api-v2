import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "ficha_garantia_campos" })
export class FichaGarantiaCampos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: 150 })
  nombre!: string;

  @Column({ name: "clave", type: "varchar", length: 100 })
  clave!: string;

  @Column({ name: "tipo", type: "varchar", length: 30, default: "texto" })
  tipo!: string;

  @Column({ name: "requerido", type: "tinyint", default: 0 })
  requerido!: number;

  @Column({ name: "visible_en_tabla", type: "tinyint", default: 1 })
  visible_en_tabla!: number;

  @Column({ name: "editable", type: "tinyint", default: 1 })
  editable!: number;

  @Column({ name: "activo", type: "tinyint", default: 1 })
  activo!: number;

  @Column({ name: "orden", type: "int", unsigned: true, default: 0 })
  orden!: number;

  @Column({ name: "created_by", type: "bigint", unsigned: true, nullable: true })
  created_by?: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
