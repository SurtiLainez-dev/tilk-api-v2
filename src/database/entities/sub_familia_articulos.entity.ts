import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'sub_familia_articulos' })
export class SubFamiliaArticulosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 60 })
  nombre!: string;

  @Column({ name: 'codigo', type: 'int' })
  codigo!: number;

  @Column({ name: 'familia_articulo_id', type: 'bigint', unsigned: true })
  familia_articulo_id!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'is_online', type: 'tinyint', default: 0 })
  is_online!: number;

  @Column({ name: 'img', type: 'varchar', length: 300, nullable: true })
  img!: string | null;

}
