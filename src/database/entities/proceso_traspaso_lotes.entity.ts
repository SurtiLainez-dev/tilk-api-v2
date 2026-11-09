import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'proceso_traspaso_lotes' })
export class ProcesoTraspasoLotesEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'cod', type: 'varchar', length: 20 })
  cod!: string;

  @Column({ name: 'comentario', type: 'varchar', length: 255, nullable: true })
  comentario!: string | null;

  @Column({ name: 'fecha_enviado_bufete', type: 'date', nullable: true })
  fecha_enviado_bufete!: string | null;

  @Column({ name: 'fecha_retornado_bufete', type: 'date', nullable: true })
  fecha_retornado_bufete!: string | null;

  @Column({ name: 'fecha_enviado_ip', type: 'date', nullable: true })
  fecha_enviado_ip!: string | null;

  @Column({ name: 'fecha_inscrita_ip', type: 'date', nullable: true })
  fecha_inscrita_ip!: string | null;

  @Column({ name: 'fecha_recibida', type: 'date', nullable: true })
  fecha_recibida!: string | null;

  @Column({ name: 'hoja_entrega', type: 'varchar', length: 255, nullable: true })
  hoja_entrega!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
