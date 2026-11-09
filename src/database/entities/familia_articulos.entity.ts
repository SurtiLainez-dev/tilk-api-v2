import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "familia_articulos" })
export class FamiliaArticulos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: 60 })
  nombre!: string;

  @Column({ name: "codigo", type: "int" })
  codigo!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;

  @Column({ name: "is_online", type: "tinyint", default: 0 })
  is_online!: number;

  @Column({ name: "img", type: "varchar", length: 300, nullable: true })
  img?: string | null;
}
