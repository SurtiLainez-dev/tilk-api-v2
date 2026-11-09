import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ct_acreedors' })
export class CtAcreedors {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: 100 })
  nombre!: string;

  @Column({ name: "cc_id", type: "bigint", unsigned: true })
  cc_id!: string;

  @Column({ name: "identificacion", type: "varchar", length: 15 })
  identificacion!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
