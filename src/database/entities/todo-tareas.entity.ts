import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'todo_tareas' })
export class TodoTareasEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'habilitacion', type: 'timestamp', nullable: true })
  habilitacion!: Date | null;

  @Column({ name: 'finalizacion', type: 'timestamp', nullable: true })
  finalizacion!: Date | null;

  @Column({ name: 'todo_estado_id', type: 'bigint', unsigned: true })
  todo_estado_id!: string;

  @Column({ name: 'todo_grupo_id', type: 'bigint', unsigned: true })
  todo_grupo_id!: string;

  @Column({ name: 'titulo', type: 'varchar', length: 150 })
  titulo!: string;

  @Column({ name: 'detalle', type: 'varchar', length: 255 })
  detalle!: string;

  @Column({ name: 'historial', type: 'json' })
  historial!: unknown;

  @Column({ name: 'archivos', type: 'json', nullable: true })
  archivos!: unknown | null;

  @Column({ name: 'links', type: 'json', nullable: true })
  links!: unknown | null;

  @Column({ name: 'estado', type: 'tinyint' })
  estado!: number;

  @Column({ name: 'usuarios', type: 'json', nullable: true })
  usuarios!: unknown | null;

  @Column({ name: 'check_list', type: 'json', nullable: true })
  check_list!: unknown | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'comentarios', type: 'json', nullable: true })
  comentarios!: unknown | null;

  @Column({ name: 'comentario', type: 'varchar', length: 400, nullable: true })
  comentario!: string | null;

}
