import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Exam } from './Exam';
import { Question } from './Question';
import { QuestionOption } from './QuestionOption';

@Entity('user_answers')
export class UserAnswer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, user => user.userAnswers)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    examId: string;

    @ManyToOne(() => Exam, exam => exam.userAnswers)
    @JoinColumn({ name: 'examId' })
    exam: Exam;

    @Column()
    questionId: string;

    @ManyToOne(() => Question, question => question.userAnswers)
    @JoinColumn({ name: 'questionId' })
    question: Question;

    @Column()
    selectedOptionId: string;

    @ManyToOne(() => QuestionOption)
    @JoinColumn({ name: 'selectedOptionId' })
    selectedOption: QuestionOption;

    @Column({ default: false })
    isCorrect: boolean;

    @Column({ type: 'int', default: 0 })
    pointsEarned: number;

    @Column({ type: 'int' })
    timeSpentSeconds: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
