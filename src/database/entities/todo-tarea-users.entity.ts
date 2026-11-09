import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'todo_tarea_users' })
export class TodoTareaUsersEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'estado', type: 'tinyint', default: 1 })
  estado!: number;

  @Column({ name: 'todo_tarea_id', type: 'bigint', unsigned: true })
  todo_tarea_id!: string;

  @Column({ name: 'checks', type: 'json', nullable: true })
  checks!: unknown | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
