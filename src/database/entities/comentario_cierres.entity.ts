import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'comentario_cierres' })
export class ComentarioCierres {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "cierre_caja_id", type: "bigint", unsigned: true })
  cierre_caja_id!: string;

  @Column({ name: "comentario", type: "varchar", length: 255 })
  comentario!: string;

  @Column({ name: "visible", type: "tinyint", default: 0 })
  visible!: number;

  @Column({ name: "falta_grave", type: "tinyint", default: 0 })
  falta_grave!: number;

  @Column({ name: "revision", type: "tinyint", default: 0 })
  revision!: number;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
