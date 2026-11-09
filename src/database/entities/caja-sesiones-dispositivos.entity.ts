
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'

@Entity({ name: 'caja_sesiones_dispositivos' })
@Index('uq_caja_sesion_uuid', ['sesion_uuid'], { unique: true })
@Index('uq_caja_sesion_token_hash', ['token_hash'], { unique: true })
@Index('idx_caja_sesion_usuario', ['user_id', 'fecha_inicio'])
@Index('idx_caja_sesion_caja', ['caja_id', 'fecha_inicio'])
@Index('idx_caja_sesion_sucursal', ['sucursal_id', 'fecha_inicio'])
@Index('idx_caja_sesion_ip', ['ip_address'])
@Index('idx_caja_sesion_expiracion', ['fecha_expiracion'])
export class CajaSesionDispositivo {
    @PrimaryGeneratedColumn({
        type: 'bigint',
        unsigned: true,
    })
    id!: string

    @Column({
        type: 'char',
        length: 36,
    })
    sesion_uuid!: string

    @Column({
        type: 'char',
        length: 64,
        nullable: true,
    })
    token_hash!: string | null

    @Column({
        type: 'bigint',
        unsigned: true,
    })
    user_id!: string

    @Column({
        type: 'bigint',
        unsigned: true,
    })
    caja_id!: string

    @Column({
        type: 'bigint',
        unsigned: true,
    })
    sucursal_id!: string

    @Column({
        type: 'varchar',
        length: 45,
        nullable: true,
    })
    ip_address!: string | null

    @Column({
        type: 'text',
        nullable: true,
    })
    user_agent!: string | null

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    navegador!: string | null

    @Column({
        type: 'varchar',
        length: 50,
        nullable: true,
    })
    navegador_version!: string | null

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    sistema_operativo!: string | null

    @Column({
        type: 'varchar',
        length: 50,
        nullable: true,
    })
    sistema_version!: string | null

    @Column({
        type: 'varchar',
        length: 30,
        default: 'DESCONOCIDO',
    })
    tipo_dispositivo!: string

    @Column({
        type: 'varchar',
        length: 150,
        nullable: true,
    })
    dispositivo!: string | null

    @Column({
        type: 'varchar',
        length: 30,
        default: 'CAJA',
    })
    origen!: string

    @Column({
        type: 'datetime',
        precision: 6,
    })
    fecha_inicio!: Date

    @Column({
        type: 'datetime',
        precision: 6,
    })
    fecha_expiracion!: Date

    @Column({
        type: 'datetime',
        precision: 6,
        nullable: true,
    })
    fecha_ultimo_uso!: Date | null

    @Column({
        type: 'datetime',
        precision: 6,
        nullable: true,
    })
    fecha_cierre!: Date | null

    @Column({
        type: 'varchar',
        length: 40,
        nullable: true,
    })
    motivo_cierre!: string | null

    @CreateDateColumn({
        type: 'timestamp',
        precision: 6,
    })
    created_at!: Date

    @UpdateDateColumn({
        type: 'timestamp',
        precision: 6,
    })
    updated_at!: Date
}
