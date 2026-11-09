import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'politica_garantias' })
export class PoliticaGarantias {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'contacto_proveedor_id', type: 'bigint', unsigned: true })
  contacto_proveedor_id!: string;

  @Column({ name: 'cod', type: 'varchar', length: 15 })
  cod!: string;

  @Column({ name: 'ultima_mod', type: 'date' })
  ultima_mod!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ name: 'tiempo_vigencia', type: 'varchar', length: 20 })
  tiempo_vigencia!: string;

  @Column({ name: 'contenido_articulo', type: 'json' })
  contenido_articulo!: unknown;

  @Column({ name: 'pdf_proveedor', type: 'varchar', length: 255 })
  pdf_proveedor!: string;

  @Column({ name: 'recomendaciones', type: 'json', nullable: true })
  recomendaciones!: unknown | null;

  @Column({ name: 'biblioteca_files', type: 'json', nullable: true })
  biblioteca_files!: unknown | null;

  @Column({ name: 'pasos_solicitar_garantia', type: 'json', nullable: true })
  pasos_solicitar_garantia!: unknown | null;

  @Column({ name: 'no_aplica_garantia', type: 'json', nullable: true })
  no_aplica_garantia!: unknown | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
