import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'contizacions' })
export class Contizacions {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "cod_cotizacion", type: "varchar", length: 13 })
  cod_cotizacion!: string;

  @Column({ name: "fecha_creacion", type: "date" })
  fecha_creacion!: string;

  @Column({ name: "proveedor_id", type: "bigint", unsigned: true })
  proveedor_id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "file", type: "varchar", length: 255, nullable: true })
  file!: string | null;

}
