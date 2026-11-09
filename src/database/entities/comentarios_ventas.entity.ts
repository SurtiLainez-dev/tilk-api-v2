import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'comentarios_ventas' })
export class ComentariosVentas {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "venta_id", type: "bigint", unsigned: true })
  venta_id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "tipo", type: "varchar", length: 50, default: "COMENTARIO" })
  tipo!: string;

  @Column({ name: "origen", type: "varchar", length: 50, nullable: true })
  origen!: string | null;

  @Column({ name: "comentario", type: "text" })
  comentario!: string;

  @Column({ name: "fecha_promesa", type: "datetime", nullable: true })
  fecha_promesa!: string | null;

  @Column({ name: "monto_promesa", type: "decimal", precision: 12, scale: 2, nullable: true })
  monto_promesa!: string | null;

  @Column({ name: "estado", type: "tinyint", default: 1 })
  estado!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
