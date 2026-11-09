import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuerpo_orden_compras' })
export class CuerpoOrdenCompras {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "orden_compra_id", type: "bigint", unsigned: true })
  orden_compra_id!: string;

  @Column({ name: "descripcion", type: "varchar", length: 300 })
  descripcion!: string;

  @Column({ name: "cantidad", type: "int" })
  cantidad!: number;

  @Column({ name: "precio_costo", type: "double", precision: 9, scale: 2 })
  precio_costo!: number;

  @Column({ name: "impuesto", type: "double", precision: 3, scale: 1 })
  impuesto!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

  @Column({ name: "articulo_id", type: "bigint", unsigned: true })
  articulo_id!: string;

}
