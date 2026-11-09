import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notas_c_p_devolucions' })
export class NotasCPDevolucions {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'notas_credito_proveedor_id', type: 'bigint', unsigned: true })
  notas_credito_proveedor_id!: string;

  @Column({ name: 'devolucion_proveedor_id', type: 'bigint', unsigned: true })
  devolucion_proveedor_id!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
