import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tareas' })
export class TareasEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ type: 'varchar', length: 240, comment: "detalle corto de la tarea" })
  detalle!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ruta_back?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ruta_front?: string | null;

  @Column({ type: 'varchar', length: 50, comment: "seguimeinto - cobro" })
  tipo_tarea!: string;

  @Column({ type: 'int', comment: "abierta - concluida - atrasado - pendiente" })
  estado!: number;

  @Column({ type: 'int', comment: "carga datos en el back - carga datos en el front" })
  tipo!: number;

  @Column({ type: 'tinyint', comment: "si el usuario ya lo reviso" })
  is_revisado!: number;

  @Column({ type: 'time', nullable: true, comment: "mommento en que lo abrio" })
  hora_abierto?: string | null;

  @Column({ type: 'json', comment: "acciones que ha hecho el usuario" })
  historial!: unknown;

  @Column({ type: 'int', nullable: true })
  tiempo_duracion?: number | null;

  @Column({ type: 'int', nullable: true, comment: "Si es rapido, promedio, lento" })
  eficiencia?: number | null;

  @Column({ type: 'datetime', nullable: true, comment: "tiempo en que el usuario lo termino" })
  fecha_concluido?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

  @Column({ type: 'date', nullable: true })
  fecha_creado?: Date | null;

  @Column({ type: 'date', nullable: true })
  fecha_abierto?: Date | null;

}
