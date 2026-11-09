import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuerpo_presupuesto_caja_chicas' })
export class CuerpoPresupuestoCajaChicas {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "tipo_gasto_id", type: "bigint", unsigned: true })
  tipo_gasto_id!: string;

  @Column({ name: "presupuesto_caja_chica_id", type: "bigint", unsigned: true })
  presupuesto_caja_chica_id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "fecha_propuesta", type: "date", comment: "Es la fecha en que se pretende usar el gasto" })
  fecha_propuesta!: string;

  @Column({ name: "fecha_limite", type: "date", comment: "es la fecha limite para hacer el gasto" })
  fecha_limite!: string;

  @Column({ name: "total_presupuestado", type: "double", precision: 9, scale: 2, comment: "es el total ficticio o que se provee que va a ser" })
  total_presupuestado!: number;

  @Column({ name: "total_gastado", type: "double", precision: 9, scale: 2, comment: "es el total real que se gasto" })
  total_gastado!: number;

  @Column({ name: "diferencia", type: "double", precision: 9, scale: 2, comment: "es la diferencia que hay entre el total_presupuestado y el total_gastado" })
  diferencia!: number;

  @Column({ name: "comentario", type: "text", nullable: true, comment: "si es necesario comentar por que se da el gasto" })
  comentario!: string | null;

  @Column({ name: "comentario_cierre", type: "text", nullable: true, comment: "si hay diferencia escribir la razon" })
  comentario_cierre!: string | null;

  @Column({ name: "is_aprobado_admin", type: "int", comment: "si el admin lo autoriza, aparecera check marcado" })
  is_aprobado_admin!: number;

  @Column({ name: "is_ejecutado", type: "int", comment: "si esta marcado, significa que el usuario ya lo cargo" })
  is_ejecutado!: number;

  @Column({ name: "gasto_id", type: "bigint", unsigned: true, nullable: true })
  gasto_id!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
