import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("historial_cajas")
export class HistorialCajas {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  cajas_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  forma_pago_id!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  referencia?: string | null;

  @Column({ type: 'int' })
  tipo_documento!: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  recibo_id?: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  factura_id?: string | null;

  @Column({ type: 'double' })
  total!: number;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

  @Column({ type: 'tinyint', nullable: true, default: 0 })
  tipo?: number | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  historial?: string | null;

}
