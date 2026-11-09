import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tipo_gastos' })
export class TipoGastosEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'bigint', unsigned: true })
  cc_id!: string;

  @Column({ type: 'varchar', length: 50 })
  cod!: string;

  @Column({ type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
