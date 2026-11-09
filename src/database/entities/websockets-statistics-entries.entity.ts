import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'websockets_statistics_entries' })
export class WebsocketsStatisticsEntriesEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', unsigned: true })
  id!: number;

  @Column({ name: 'app_id', type: 'varchar', length: 255 })
  app_id!: string;

  @Column({ name: 'peak_connection_count', type: 'int' })
  peak_connection_count!: number;

  @Column({ name: 'websocket_message_count', type: 'int' })
  websocket_message_count!: number;

  @Column({ name: 'api_message_count', type: 'int' })
  api_message_count!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
