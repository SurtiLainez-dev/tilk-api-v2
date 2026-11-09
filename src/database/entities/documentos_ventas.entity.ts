import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "documentos_ventas" })
export class DocumentosVentas {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "venta_id", type: "bigint", unsigned: true })
  venta_id!: string;

  @Column({ name: "contrato", type: "varchar", length: 255, nullable: true })
  contrato?: string | null;

  @Column({ name: "traspaso", type: "varchar", length: 255, nullable: true })
  traspaso?: string | null;

  @Column({ name: "carta_poder", type: "varchar", length: 255, nullable: true })
  carta_poder?: string | null;

  @Column({ name: "conocimiento_tramite", type: "varchar", length: 255, nullable: true })
  conocimiento_tramite?: string | null;

  @Column({ name: "garantia_prendaria", type: "varchar", length: 255, nullable: true })
  garantia_prendaria?: string | null;

  @Column({ name: "garantia_motocicleta", type: "varchar", length: 255, nullable: true })
  garantia_motocicleta?: string | null;

  @Column({ name: "garantia_articulo", type: "varchar", length: 255, nullable: true })
  garantia_articulo?: string | null;

  @Column({ name: "hoja_entrega", type: "varchar", length: 255, nullable: true })
  hoja_entrega?: string | null;

  @Column({ name: "hoja_abonos", type: "varchar", length: 255, nullable: true })
  hoja_abonos?: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;

  @Column({ name: "factura_sar", type: "varchar", length: 255, nullable: true })
  factura_sar?: string | null;

  @Column({ name: "tarjeta_fisica", type: "varchar", length: 255, nullable: true })
  tarjeta_fisica?: string | null;

  @Column({ name: "expediente", type: "varchar", length: 255, nullable: true })
  expediente?: string | null;

  @Column({ name: "firmas", type: "json", nullable: true })
  firmas?: unknown | null;
}
