import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'top_five_categorias' })
export class TopFiveCategoriasEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'sub_familia_articulo_id', type: 'bigint', unsigned: true })
  sub_familia_articulo_id!: string;

  @Column({ name: 'img', type: 'varchar', length: 250, nullable: true })
  img!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
