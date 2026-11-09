import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'orden_entrega_documentos' })
export class OrdenEntregaDocumentos {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'orden_entrega_id', type: 'bigint', unsigned: true })
  orden_entrega_id!: string;

  @Column({ name: 'remision_articulo_id', type: 'bigint', unsigned: true, nullable: true })
  remision_articulo_id!: string | null;

  @Column({ name: 'factura_contado_id', type: 'bigint', unsigned: true, nullable: true })
  factura_contado_id!: string | null;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true })
  user_id!: string | null;

  @Column({ name: 'tipo', type: 'varchar', length: 30, default: 'FOTO' })
  tipo!: string;

  @Column({ name: 'url', type: 'varchar', length: 500 })
  url!: string;

  @Column({ name: 'detalle', type: 'varchar', length: 255, nullable: true })
  detalle!: string | null;

  @Column({ name: 'estado', type: 'tinyint', default: 1 })
  estado!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
