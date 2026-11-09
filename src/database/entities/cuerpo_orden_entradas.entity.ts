import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuerpo_orden_entradas' })
export class CuerpoOrdenEntradas {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "orden_entrada_id", type: "bigint", unsigned: true })
  orden_entrada_id!: string;

  @Column({ name: "articulo_id", type: "bigint", unsigned: true })
  articulo_id!: string;

  @Column({ name: "cantidad", type: "int" })
  cantidad!: number;

  @Column({ name: "is_compuesto", type: "tinyint" })
  is_compuesto!: number;

  @Column({ name: "estado_articulo_id", type: "bigint", unsigned: true })
  estado_articulo_id!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
