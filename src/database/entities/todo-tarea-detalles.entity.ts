import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'todo_tarea_detalles' })
export class TodoTareaDetallesEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'venta_id', type: 'bigint', unsigned: true, nullable: true })
  venta_id!: string | null;

  @Column({ name: 'articulo_id', type: 'bigint', unsigned: true, nullable: true })
  articulo_id!: string | null;

  @Column({ name: 'caja_chica_id', type: 'bigint', unsigned: true, nullable: true })
  caja_chica_id!: string | null;

  @Column({ name: 'cierre_caja_id', type: 'bigint', unsigned: true, nullable: true })
  cierre_caja_id!: string | null;

  @Column({ name: 'recibo_id', type: 'bigint', unsigned: true, nullable: true })
  recibo_id!: string | null;

  @Column({ name: 'tipo', type: 'int' })
  tipo!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
