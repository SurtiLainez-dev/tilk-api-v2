import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'web_banners' })
export class WebBannersEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'pre_titulo', type: 'varchar', length: 200 })
  pre_titulo!: string;

  @Column({ name: 'pre_precio', type: 'int', nullable: true })
  pre_precio!: number | null;

  @Column({ name: 'detalle', type: 'varchar', length: 450 })
  detalle!: string;

  @Column({ name: 'sub_title_1', type: 'varchar', length: 150, nullable: true })
  sub_title_1!: string | null;

  @Column({ name: 'sub_title_2', type: 'varchar', length: 150, nullable: true })
  sub_title_2!: string | null;

  @Column({ name: 'sub_precio', type: 'int', nullable: true })
  sub_precio!: number | null;

  @Column({ name: 'btn', type: 'tinyint', default: 0 })
  btn!: number;

  @Column({ name: 'btn_titulo', type: 'varchar', length: 25, nullable: true })
  btn_titulo!: string | null;

  @Column({ name: 'img_back', type: 'varchar', length: 250, nullable: true })
  img_back!: string | null;

  @Column({ name: 'img', type: 'varchar', length: 250 })
  img!: string;

  @Column({ name: 'ruta', type: 'varchar', length: 100, nullable: true })
  ruta!: string | null;

  @Column({ name: 'color', type: 'varchar', length: 20 })
  color!: string;

  @Column({ name: 'estado', type: 'varchar', length: 255, default: '1' })
  estado!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
