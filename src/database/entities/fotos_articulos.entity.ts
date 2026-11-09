import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "fotos_articulos" })
export class FotosArticulos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "detalle", type: "varchar", length: 100 })
  detalle!: string;

  @Column({ name: "isPrincipal", type: "tinyint" })
  isPrincipal!: number;

  @Column({ name: "url", type: "varchar", length: 200 })
  url!: string;

  @Column({ name: "articulo_id", type: "bigint", unsigned: true })
  articulo_id!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;

  @Column({ name: "color", type: "varchar", length: 10, nullable: true })
  color?: string | null;
}
