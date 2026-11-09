
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'auth_documentos' })
export class AuthDocumentos {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'varchar', length: 65 })
    token!: string;

    @Column({ type: 'bigint', unsigned: true })
    user_id!: string;

    @Column({ type: 'datetime' })
    expiracion!: Date;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;

    @Column({ type: 'int', default: 0 })
    estado!: number;
}
