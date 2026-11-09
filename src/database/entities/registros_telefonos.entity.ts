import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'registros_telefonos' })
export class RegistrosTelefonosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'telefonos_cliente_id', type: 'bigint', unsigned: true })
  telefonos_cliente_id!: string;

  @Column({ name: 'forma_contacto', type: 'enum', enum: ['LLAMADA', 'MENSAJE_TEXTO', 'MENSAJE_WHATSAAP', 'TELEGRAM', 'COMENTARIO'] })
  forma_contacto!: string;

  @Column({ name: 'mensaje', type: 'varchar', length: 255 })
  mensaje!: string;

  @Column({ name: 'referencia', type: 'varchar', length: 50 })
  referencia!: string;

  @Column({ name: 'tipo_notificacion', type: 'enum', enum: ['COBRO', 'AVISO', 'MARKETING', 'SAC', 'VENTA', 'COMENTARIO_SISTEMA', 'VERIFICACION'] })
  tipo_notificacion!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
