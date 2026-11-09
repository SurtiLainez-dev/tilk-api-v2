import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "data_notifications" })
export class DataNotifications {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "nombre", type: "varchar", length: 255 })
  nombre!: string;

  @Column({ name: "user", type: "varchar", length: 255 })
  user!: string;

  @Column({ name: "password", type: "varchar", length: 255 })
  password!: string;

  @Column({ name: "tipo", type: "int" })
  tipo!: number;

  @Column({ name: "aws_region", type: "varchar", length: 255, nullable: true })
  aws_region?: string | null;

  @Column({ name: "aws_d_region", type: "varchar", length: 255, nullable: true })
  aws_d_region?: string | null;

  @Column({ name: "aws_bucket", type: "varchar", length: 255, nullable: true })
  aws_bucket?: string | null;
}
