import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './Question';

@Entity('question_options')
export class QuestionOption {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    text: string;

    @Column({ nullable: true })
    imageUrl: string;

    @Column()
    questionId: string;

    @ManyToOne(() => Question, question => question.options)
    @JoinColumn({ name: 'questionId' })
    question: Question;

    @Column({ type: 'char', length: 1 })
    optionLetter: string;

    @Column({ default: false })
    isCorrect: boolean;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
