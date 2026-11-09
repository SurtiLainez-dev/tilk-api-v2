import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "failed_jobs" })
export class FailedJobs {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "connection", type: "text" })
  connection!: string;

  @Column({ name: "queue", type: "text" })
  queue!: string;

  @Column({ name: "payload", type: "longtext" })
  payload!: string;

  @Column({ name: "exception", type: "longtext" })
  exception!: string;

  @Column({ name: "failed_at", type: "timestamp", default: () => 'CURRENT_TIMESTAMP' })
  failed_at!: Date;
}
