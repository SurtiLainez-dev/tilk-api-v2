import {
    Column,
    Entity,
    PrimaryColumn,
} from 'typeorm';

@Entity({
    name: 'nota_credito_cliente_contadores',
})
export class NotaCreditoClienteContadores {

    @PrimaryColumn({
        name: 'cliente_id',
        type: 'bigint',
        unsigned: true,
    })
    cliente_id!: string;

    @Column({
        name: 'contador_actual',
        type: 'int',
        unsigned: true,
        default: 0,
    })
    contador_actual!: number;

    @Column({
        name: 'created_at',
        type: 'timestamp',
        nullable: true,
        default: null,
    })
    created_at!: Date | null;

    @Column({
        name: 'updated_at',
        type: 'timestamp',
        nullable: true,
        default: null,
    })
    updated_at!: Date | null;
}