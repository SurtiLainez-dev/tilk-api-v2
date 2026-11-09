import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'orden_cuerpo_compuestos' })
export class OrdenCuerpoCompuestos {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'cuerpo_orden_entrada_id', type: 'bigint', unsigned: true })
  cuerpo_orden_entrada_id!: string;

  @Column({ name: 'articulo_compuesto_id', type: 'bigint', unsigned: true })
  articulo_compuesto_id!: string;

  @Column({ name: 'cantidad', type: 'int' })
  cantidad!: number;

  @Column({ name: 'estado', type: 'tinyint' })
  estado!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
