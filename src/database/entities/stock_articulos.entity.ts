import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'stock_articulos' })
export class StockArticulosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'sucursal_id', type: 'bigint', unsigned: true })
  sucursal_id!: string;

  @Column({ name: 'stock_actual', type: 'int' })
  stock_actual!: number;

  @Column({ name: 'articulo_id', type: 'bigint', unsigned: true })
  articulo_id!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'stock_consignado', type: 'int' })
  stock_consignado!: number;

  @Column({ name: 'stock_reingreso', type: 'int' })
  stock_reingreso!: number;

  @Column({ name: 'stock_facturado', type: 'int', nullable: true })
  stock_facturado!: number | null;

}
