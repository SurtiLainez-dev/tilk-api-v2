
import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "cajas" })
export class Cajas {
  @PrimaryGeneratedColumn({
    name: "id",
    type: "bigint",
    unsigned: true,
  })
  id!: string;

  @Index("cajas_slug_unique", { unique: true })
  @Column({
    name: "slug",
    type: "varchar",
    length: 100,
    nullable: false,
  })
  slug!: string;

  @Column({
    name: "sucursal_id",
    type: "bigint",
    unsigned: true,
  })
  sucursal_id!: string;

  @Column({
    name: "user_id",
    type: "bigint",
    unsigned: true,
  })
  user_id!: string;

  @Column({
    name: "codigo",
    type: "varchar",
    length: 10,
  })
  codigo!: string;

  @Column({
    name: "num_caja",
    type: "int",
  })
  num_caja!: number;

  @Column({
    name: "estado_cierre",
    type: "tinyint",
  })
  estado_cierre!: number;

  @Column({
    name: "total",
    type: "double",
    precision: 10,
    scale: 2,
  })
  total!: number;

  @Column({
    name: "created_at",
    type: "timestamp",
    nullable: true,
  })
  created_at!: Date | null;

  @Column({
    name: "updated_at",
    type: "timestamp",
    nullable: true,
  })
  updated_at!: Date | null;

  @Column({
    name: "registro",
    type: "varchar",
    length: 10,
    nullable: true,
  })
  registro!: string | null;

  @Column({
    name: "resumen",
    type: "json",
    nullable: true,
    comment: "es lo que ha hecho en el dia, borrar a media noche",
  })
  resumen!: unknown | null;

  @Column({
    name: "total_inicio",
    type: "tinyint",
    nullable: true,
  })
  total_inicio!: number | null;

  @Column({
    name: "hora_inicio",
    type: "time",
    nullable: true,
  })
  hora_inicio!: string | null;

  @Column({
    name: "hora_cierre",
    type: "time",
    nullable: true,
  })
  hora_cierre!: string | null;

  @Column({
    name: "estado",
    type: "tinyint",
    nullable: true,
  })
  estado!: number | null;

  @Column({
    name: "password",
    type: "varchar",
    length: 255,
    nullable: true,
    select: false,
  })
  password!: string | null;

  @Column({
    name: "activa",
    type: "tinyint",
    nullable: true,
  })
  activa!: number | null;

  @Column({
    name: "is_conta",
    type: "tinyint",
    nullable: true,
  })
  is_conta!: number | null;

  @Column({
    name: "saldo_acumulado",
    type: "double",
    precision: 9,
    scale: 2,
    default: "0.00",
    comment:
        "cuando la caja no cierra en 0 y se tiene que hacer deposito de otro dia",
  })
  saldo_acumulado!: number;
}
