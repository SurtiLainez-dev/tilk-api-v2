import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ct_tipo_contrato_proveedors' })
export class CtTipoContratoProveedors {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: 50 })
  nombre!: string;

  @Column({ name: "cod_cc", type: "varchar", length: 50, nullable: true })
  cod_cc!: string | null;

}
