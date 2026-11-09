import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'permiso_circulars' })
export class PermisoCirculars {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'venta_id', type: 'bigint', unsigned: true })
  venta_id!: string;

  @Column({ name: 'motocicleta_id', type: 'bigint', unsigned: true })
  motocicleta_id!: string;

  @Column({ name: 'cod', type: 'varchar', length: 15 })
  cod!: string;

  @Column({ name: 'estado', type: 'enum', enum: ['VENCIDO', 'VIGENTE'], default: 'VIGENTE' })
  estado!: string;

  @Column({ name: 'fecha_vencimiento', type: 'date' })
  fecha_vencimiento!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
