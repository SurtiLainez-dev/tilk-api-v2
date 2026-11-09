import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuerpo_cotizacions' })
export class CuerpoCotizacions {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "contizacion_id", type: "bigint", unsigned: true })
  contizacion_id!: string;

  @Column({ name: "articulo", type: "varchar", length: 300 })
  articulo!: string;

  @Column({ name: "cantidad", type: "double" })
  cantidad!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
