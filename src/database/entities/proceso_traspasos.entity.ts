import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'proceso_traspasos' })
export class ProcesoTraspasosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'uuid', type: 'char', length: 36 })
  uuid!: string;

  @Column({ name: 'cod', type: 'varchar', length: 20 })
  cod!: string;

  @Column({ name: 'motocicleta_id', type: 'bigint', unsigned: true })
  motocicleta_id!: string;

  @Column({ name: 'venta_id', type: 'bigint', unsigned: true })
  venta_id!: string;

  @Column({ name: 'nombre_solicitante', type: 'varchar', length: 255 })
  nombre_solicitante!: string;

  @Column({ name: 'doc_identidad_id', type: 'bigint', unsigned: true, nullable: true })
  doc_identidad_id!: string | null;

  @Column({ name: 'url_identidad', type: 'varchar', length: 255, nullable: true })
  url_identidad!: string | null;

  @Column({ name: 'doc_rtn_id', type: 'bigint', unsigned: true, nullable: true })
  doc_rtn_id!: string | null;

  @Column({ name: 'url_rtn', type: 'varchar', length: 255, nullable: true })
  url_rtn!: string | null;

  @Column({ name: 'doc_domicilio_id', type: 'bigint', unsigned: true, nullable: true })
  doc_domicilio_id!: string | null;

  @Column({ name: 'url_domicilio', type: 'varchar', length: 255, nullable: true })
  url_domicilio!: string | null;

  @Column({ name: 'url_boleta', type: 'varchar', length: 255, nullable: true })
  url_boleta!: string | null;

  @Column({ name: 'estado', type: 'enum', enum: ['CREADO', 'NO PROCEDE - VENTA NO CANCELADA', 'NO PROCEDE - FALTA DOCUMENTACION', 'CASO ENVIADO', 'CASO RETORNADO EXITOSAMENTE', 'CASO ENVIADO AL IP', 'LISTO PARA ENTREGA', 'ENTREGADO', 'REENVIADO', 'TRASPASO RECIBIDO'] })
  estado!: string;

  @Column({ name: 'fecha_enviado', type: 'date', nullable: true })
  fecha_enviado!: string | null;

  @Column({ name: 'colonia_id', type: 'bigint', unsigned: true, nullable: true })
  colonia_id!: string | null;

  @Column({ name: 'fecha_enviado_ip', type: 'date', nullable: true })
  fecha_enviado_ip!: string | null;

  @Column({ name: 'fecha_recibido', type: 'date', nullable: true })
  fecha_recibido!: string | null;

  @Column({ name: 'fecha_entregado', type: 'date', nullable: true })
  fecha_entregado!: string | null;

  @Column({ name: 'area_telefonica', type: 'varchar', length: 255 })
  area_telefonica!: string;

  @Column({ name: 'num_telefono', type: 'varchar', length: 255 })
  num_telefono!: string;

  @Column({ name: 'email', type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'hoja_entrega', type: 'varchar', length: 255, nullable: true })
  hoja_entrega!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'tipo', type: 'enum', enum: ['PROPIO', 'TERCERO'], nullable: true, default: "PROPIO" })
  tipo!: string | null;

  @Column({ name: 'id_solicitante', type: 'varchar', length: 20, nullable: true, default: "0" })
  id_solicitante!: string | null;

}
