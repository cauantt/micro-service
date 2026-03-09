import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
  @Index()
  @Column({ unique: true })
  email: string;

  // 1. A SENHA AGORA É OPCIONAL (nullable: true)
  // Quem loga com Google não tem senha no nosso banco.
  @Column({ select: false, nullable: true })
  password?: string;

  // 2. DE ONDE O USUÁRIO VEIO?
  // Pode ser 'local' (criado na mão), 'google', 'apple', etc.
  @Column({ nullable: true })
  provider?: string;

  // 3. O ID DELE NO PROVEDOR
  // Guarda o ID único que o Google devolveu.
  @Column({ nullable: true })
  providerId?: string;

  @CreateDateColumn()
  createdAt: Date;
}