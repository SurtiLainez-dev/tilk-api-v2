import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'seguimiento_ventas' })
export class SeguimientoVentasEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'cliente_id', type: 'bigint', unsigned: true })
  cliente_id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'articulo_id', type: 'bigint', unsigned: true })
  articulo_id!: string;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fecha_inicio!: string;

  @Column({ name: 'detalles', type: 'json' })
  detalles!: Record<string, unknown> | unknown[];

  @Column({ name: 'tareas', type: 'json' })
  tareas!: Record<string, unknown> | unknown[];

  @Column({ name: 'estado', type: 'int' })
  estado!: number;

  @Column({ name: 'conclucion', type: 'varchar', length: 255, nullable: true })
  conclucion!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'comentario', type: 'varchar', length: 255, nullable: true })
  comentario!: string | null;

}
