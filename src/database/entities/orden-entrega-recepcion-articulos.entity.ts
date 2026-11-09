import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'orden_entrega_recepcion_articulos' })
export class OrdenEntregaRecepcionArticulos {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'recepcion_id', type: 'bigint', unsigned: true })
  recepcion_id!: string;

  @Column({ name: 'articulo_id', type: 'bigint', unsigned: true })
  articulo_id!: string;

  @Column({ name: 'remision_articulo_id', type: 'bigint', unsigned: true, nullable: true })
  remision_articulo_id!: string | null;

  @Column({ name: 'estado_fisico', type: 'tinyint', default: 0 })
  estado_fisico!: number;

  @Column({ name: 'empaque', type: 'tinyint', default: 0 })
  empaque!: number;

  @Column({ name: 'accesorios', type: 'tinyint', default: 0 })
  accesorios!: number;

  @Column({ name: 'modelo', type: 'tinyint', default: 0 })
  modelo!: number;

  @Column({ name: 'color', type: 'tinyint', default: 0 })
  color!: number;

  @Column({ name: 'serie', type: 'tinyint', default: 0 })
  serie!: number;

  @Column({ name: 'funcionamiento', type: 'tinyint', default: 0 })
  funcionamiento!: number;

  @Column({ name: 'recibido_conforme', type: 'tinyint', default: 0 })
  recibido_conforme!: number;

  @Column({ name: 'observacion', type: 'text', nullable: true })
  observacion!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
