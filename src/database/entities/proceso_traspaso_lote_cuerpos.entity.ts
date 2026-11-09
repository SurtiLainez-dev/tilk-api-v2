import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'proceso_traspaso_lote_cuerpos' })
export class ProcesoTraspasoLoteCuerposEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'proceso_traspaso_lotes_id', type: 'bigint', unsigned: true })
  proceso_traspaso_lotes_id!: string;

  @Column({ name: 'proceso_traspaso_id', type: 'bigint', unsigned: true })
  proceso_traspaso_id!: string;

  @Column({ name: 'estado', type: 'enum', enum: ['ENVIADA', 'RECHAZADA', 'OK'] })
  estado!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
