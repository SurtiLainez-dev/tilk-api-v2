import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'verificacion_documentos' })
export class VerificacionDocumentosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'url_verificacion', type: 'varchar', length: 255 })
  url_verificacion!: string;

  @Column({ name: 'referencia', type: 'varchar', length: 50 })
  referencia!: string;

  @Column({ name: 'token', type: 'varchar', length: 15 })
  token!: string;

  @Column({ name: 'detalle', type: 'varchar', length: 255 })
  detalle!: string;

  @Column({ name: 'cant_verificado', type: 'int', default: 0 })
  cant_verificado!: number;

  @Column({ name: 'tipo', type: 'enum', enum: ['FINIQUITO', 'PERMISO_P_C_S_PLACA', 'RECIBO_POSTEO', 'FACTURA', 'ENTREGA_GENERICA'] })
  tipo!: 'FINIQUITO' | 'PERMISO_P_C_S_PLACA' | 'RECIBO_POSTEO' | 'FACTURA' | 'ENTREGA_GENERICA';

  @Column({ name: 'datos_res', type: 'json', nullable: true })
  datos_res!: unknown | null;

  @Column({ name: 'autor', type: 'varchar', length: 100 })
  autor!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
