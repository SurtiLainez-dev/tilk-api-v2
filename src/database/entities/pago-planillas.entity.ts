import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'pago_planillas' })
export class PagoPlanillas {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'cuerpo_planilla_id', type: 'bigint', unsigned: true })
  cuerpo_planilla_id!: string;

  @Column({ name: 'referencia', type: 'varchar', length: 25 })
  referencia!: string;

  @Column({ name: 'observacion', type: 'varchar', length: 100, nullable: true })
  observacion!: string | null;

  @Column({ name: 'file', type: 'varchar', length: 255, nullable: true })
  file!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
