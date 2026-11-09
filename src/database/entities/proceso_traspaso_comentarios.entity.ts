import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'proceso_traspaso_comentarios' })
export class ProcesoTraspasoComentariosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'proceso_traspaso_id', type: 'bigint', unsigned: true })
  proceso_traspaso_id!: string;

  @Column({ name: 'user', type: 'varchar', length: 255 })
  user!: string;

  @Column({ name: 'comentario', type: 'varchar', length: 2000 })
  comentario!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
