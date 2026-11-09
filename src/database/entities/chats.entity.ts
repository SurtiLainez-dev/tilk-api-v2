import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "chats" })
export class Chats {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "autor_id", type: "bigint", unsigned: true })
  autor_id!: string;

  @Column({ name: "from_id", type: "bigint", unsigned: true })
  from_id!: string;

  @Column({ name: "to_id", type: "bigint", unsigned: true, nullable: true, comment: "es al usuario al que se le envia. si es chat queda null" })
  to_id!: string | null;

  @Column({ name: "grupo_id", type: "bigint", unsigned: true, nullable: true, comment: "si el mensaje pertenece  a un grupo" })
  grupo_id!: string | null;

  @Column({ name: "asunto", type: "varchar", length: "100", nullable: true })
  asunto!: string | null;

  @Column({ name: "contenido", type: "varchar", length: "10000", nullable: true })
  contenido!: string | null;

  @Column({ name: "is_respuesta", type: "tinyint", default: "0", comment: "si esta respondiendo a otro mensaje" })
  is_respuesta!: number;

  @Column({ name: "recibido", type: "tinyint", default: "0" })
  recibido!: number;

  @Column({ name: "is_reenvio", type: "tinyint", nullable: true, default: "0" })
  is_reenvio!: number | null;

  @Column({ name: "leido", type: "tinyint", default: "0" })
  leido!: number;

  @Column({ name: "archivo", type: "varchar", length: "255", nullable: true })
  archivo!: string | null;

  @Column({ name: "tipo", type: "enum", enum: ["TEXT", "VOICE", "PDF", "IMG", "RES"] })
  tipo!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;

  @Column({ name: "t_drive_id", type: "bigint", unsigned: true, nullable: true })
  t_drive_id!: string | null;

  @Column({ name: "msg_id", type: "bigint", nullable: true })
  msg_id!: string | null;

  @Column({ name: "fecha_ref", type: "varchar", length: "10", nullable: true })
  fecha_ref!: string | null;
}
