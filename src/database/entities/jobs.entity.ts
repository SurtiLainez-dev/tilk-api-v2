import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("jobs")
export class Jobs {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  queue!: string;

  @Column({ type: 'longtext' })
  payload!: string;

  @Column({ type: 'tinyint', unsigned: true })
  attempts!: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  reserved_at?: number | null;

  @Column({ type: 'int', unsigned: true })
  available_at!: number;

  @Column({ type: 'int', unsigned: true })
  created_at!: number;

}
