import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'comentario_ficha_garantias' })
export class ComentarioFichaGarantias {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "ficha_garantia", type: "bigint", unsigned: true })
  ficha_garantia!: string;

  @Column({ name: "comentario", type: "varchar", length: 2000 })
  comentario!: string;

  @Column({ name: "file", type: "varchar", length: 255, nullable: true })
  file!: string | null;

  @Column({ name: "user_id", type: "bigint", unsigned: true, nullable: true })
  user_id!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
