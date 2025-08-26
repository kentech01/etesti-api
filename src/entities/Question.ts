import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Exam } from './Exam';
import { QuestionOption } from './QuestionOption';
import { UserAnswer } from './UserAnswer';

@Entity('questions')
export class Question {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    text: string;

    @Column({ nullable: true })
    imageUrl: string;

    @Column()
    examId: string;

    @ManyToOne(() => Exam, exam => exam.questions)
    @JoinColumn({ name: 'examId' })
    exam: Exam;

    @Column({ type: 'char', length: 20 })
    subject: string;

    @Column({ type: 'char', length: 1, default: 'A' })
    examPart: string;

    @Column({ nullable: true })
    parentId: string;

    @Column({ nullable: true, type: 'text' })
    displayText: string;

    @Column({ type: 'int' })
    orderNumber: number;

    @Column({ type: 'int', default: 1 })
    points: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => QuestionOption, option => option.question)
    options: QuestionOption[];

    @OneToMany(() => UserAnswer, userAnswer => userAnswer.question)
    userAnswers: UserAnswer[];
}
