import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "clientes" })
export class Clientes {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "slug", type: "varchar", length: "80", nullable: true })
  slug!: string | null;

  @Column({ name: "nombres", type: "varchar", length: "50" })
  nombres!: string;

  @Column({ name: "apellidos", type: "varchar", length: "50", nullable: true })
  apellidos!: string | null;

  @Column({ name: "identidad", type: "varchar", length: "16" })
  identidad!: string;

  @Column({ name: "rtn", type: "varchar", length: "14", nullable: true })
  rtn!: string | null;

  @Column({ name: "detalles", type: "json", nullable: true })
  detalles!: unknown | null;

  @Column({ name: "archivos", type: "json", nullable: true })
  archivos!: unknown | null;

  @Column({ name: "fecha_nacimiento", type: "date", nullable: true })
  fecha_nacimiento!: string | null;

  @Column({ name: "sexo", type: "int", nullable: true })
  sexo!: number | null;

  @Column({ name: "email", type: "varchar", length: "60", nullable: true })
  email!: string | null;

  @Column({ name: "telefonos", type: "json", nullable: true })
  telefonos!: unknown | null;

  @Column({ name: "nacionalidad", type: "varchar", length: "35", nullable: true })
  nacionalidad!: string | null;

  @Column({ name: "salario", type: "double", precision: 9, scale: 2, nullable: true })
  salario!: number | null;

  @Column({ name: "empresa_trabaja", type: "varchar", length: "50", nullable: true })
  empresa_trabaja!: string | null;

  @Column({ name: "is_trabaja", type: "tinyint", nullable: true })
  is_trabaja!: number | null;

  @Column({ name: "is_casa", type: "tinyint", nullable: true })
  is_casa!: number | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;

  @Column({ name: "porcentaje_datos", type: "double", precision: 3, scale: 1, nullable: true })
  porcentaje_datos!: number | null;

  @Column({ name: "direcciones", type: "json", nullable: true })
  direcciones!: unknown | null;

  @Column({ name: "notas", type: "json", nullable: true })
  notas!: unknown | null;

  @Column({ name: "estado_civil", type: "enum", enum: ["SOLTER@", "CASAD@", "UNION LIBRE", "VIUD@", "CASADA", "CASADO", "SOLTERO"], nullable: true })
  estado_civil!: string | null;

  @Column({ name: "tipo_ingresos", type: "enum", enum: ["ASALARIADO", "NEGOCIO PROPIO", "INFORMAL", "REMESAS", "ALQUILERES"], nullable: true })
  tipo_ingresos!: string | null;

  @Column({ name: "frecuencia_ingreso", type: "enum", enum: ["DIARIO", "SEMANAL", "QUINCENAL", "MENSUAL"], nullable: true })
  frecuencia_ingreso!: string | null;

  @Column({ name: "cuanto_puede_pagar", type: "decimal", precision: 8, scale: 2, nullable: true })
  cuanto_puede_pagar!: string | null;

  @Column({ name: "nombre_conyugue", type: "varchar", length: "255", nullable: true })
  nombre_conyugue!: string | null;

  @Column({ name: "cant_hijos", type: "int", nullable: true, default: "0" })
  cant_hijos!: number | null;

  @Column({ name: "cant_dependientes", type: "int", nullable: true, default: "0" })
  cant_dependientes!: number | null;

  @Column({ name: "tipo_vivienda", type: "enum", enum: ["CASA PROPIA", "CASA FAMILIAR", "CONDOMINIO DE APARTAMENTOS", "APARTAMENTOS", "GUARDERIA", "CUARTO"] })
  tipo_vivienda!: string;

  @Column({ name: "tiempo_domicilio", type: "varchar", length: "255", nullable: true })
  tiempo_domicilio!: string | null;

  @Column({ name: "otros_ingresos", type: "varchar", length: "255", nullable: true })
  otros_ingresos!: string | null;

  @Column({ name: "total_otros_ingresos", type: "decimal", precision: 8, scale: 2, nullable: true, default: "0.00" })
  total_otros_ingresos!: string | null;

  @Column({ name: "contrato_laboral", type: "tinyint", default: "0" })
  contrato_laboral!: number;

  @Column({ name: "tiempo_laborando", type: "varchar", length: "255", nullable: true })
  tiempo_laborando!: string | null;

  @Column({ name: "huella_digital_template", type: "blob", nullable: true })
  huella_digital_template!: Buffer | null;

  @Column({ name: "rating", type: "decimal", precision: 2, scale: 1, default: "0.0" })
  rating!: string;

  @Column({ name: "raking", type: "decimal", precision: 5, scale: 2, default: "0.00" })
  raking!: string;

  @Column({ name: "migrado", type: "tinyint", default: "0" })
  migrado!: number;

  @Column({ name: "migrado_doc", type: "tinyint", nullable: true, default: "0" })
  migrado_doc!: number | null;

  @Column({ name: "tipo_cliente", type: "enum", enum: ["NATURAL", "EXTRANJERO", "EMPRESA"], nullable: true, default: "NATURAL" })
  tipo_cliente!: string | null;
}
