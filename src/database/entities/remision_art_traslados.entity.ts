import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'remision_art_traslados' })
export class RemisionArtTrasladosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'cuerpo_transferencia_id', type: 'bigint', unsigned: true })
  cuerpo_transferencia_id!: string;

  @Column({ name: 'remision_articulo_id', type: 'bigint', unsigned: true })
  remision_articulo_id!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'recibida', type: 'tinyint', nullable: true })
  recibida!: number | null;

}
