import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("mob_traslados")
export class MobTraslados {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  colaborador_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'date', nullable: true })
  fecha_entregado?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  sucursal_destino?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  nuevo_col_responsable?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file_subido?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observaciones?: string | null;

  @Column({ type: 'varchar', length: 15 })
  cod!: string;

  @Column({ type: 'int', comment: "1:sin entregar, 2:cancelada, 3:concretada" })
  estado!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
