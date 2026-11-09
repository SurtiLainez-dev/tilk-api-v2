
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ApiClientStatus = 'active' | 'revoked';

@Entity({ name: 'api_clients' })
export class ApiClients {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string;

    @Column({ type: 'char', length: 36 })
    public_id!: string;

    @Column({ type: 'varchar', length: 40 })
    nombre!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    contact_email!: string | null;

    @Column({ type: 'varchar', length: 32 })
    key_prefix!: string;

    @Column({ type: 'varchar', length: 255 })
    key_hash!: string;

    @Column({
        type: 'enum',
        enum: ['active', 'revoked'],
        default: 'active',
    })
    status!: ApiClientStatus;

    @Column({ type: 'json', nullable: true })
    allowed_ips!: unknown | null;

    @Column({ type: 'smallint', unsigned: true, default: 120 })
    rate_limit_per_min!: number;

    @Column({ type: 'text', nullable: true })
    notes!: string | null;

    @Column({ type: 'timestamp', nullable: true })
    last_used_at!: Date | null;

    @Column({ type: 'varchar', length: 64, nullable: true })
    last_used_ip!: string | null;

    @Column({ type: 'timestamp', nullable: true })
    created_at!: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;
}
