import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("inventario_compuestos")
export class InventarioCompuestos {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  articulo_compuesto_id!: string;

  @Column({ type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ type: 'int' })
  stock_nuevo!: number;

  @Column({ type: 'int' })
  stock_reingreso!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
