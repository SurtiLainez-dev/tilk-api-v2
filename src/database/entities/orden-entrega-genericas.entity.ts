import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'orden_entrega_genericas' })
export class OrdenEntregaGenericas {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'items', type: 'json' })
  items!: unknown;

  @Column({ name: 'fecha', type: 'date' })
  fecha!: string;

  @Column({ name: 'destino', type: 'varchar', length: 150 })
  destino!: string;

  @Column({ name: 'observacion', type: 'varchar', length: 255, nullable: true })
  observacion!: string | null;

  @Column({ name: 'file', type: 'varchar', length: 255, nullable: true })
  file!: string | null;

  @Column({ name: 'titulo', type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ name: 'detalle', type: 'varchar', length: 255 })
  detalle!: string;

  @Column({ name: 'colaborador_id', type: 'bigint', unsigned: true, nullable: true })
  colaborador_id!: string | null;

  @Column({ name: 'codigo', type: 'varchar', length: 15 })
  codigo!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'moto_id', type: 'bigint', unsigned: true, nullable: true })
  moto_id!: string | null;

}
