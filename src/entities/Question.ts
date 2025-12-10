import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Exam } from "./Exam";
import { QuestionOption } from "./QuestionOption";
import { UserAnswer } from "./UserAnswer";
import { Subject } from "./Subject";

@Entity("questions")
export class Question {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  text: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column()
  examId: string;

  @ManyToOne(() => Exam, (exam) => exam.questions)
  @JoinColumn({ name: "examId" })
  exam: Exam;

  @Column({ nullable: true })
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.questions)
  @JoinColumn({ name: "subjectId" })
  subject: Subject;

  @Column({ type: "char", length: 20, nullable: true })
  subjectValue: string;

  @Column({ type: "char", length: 1, default: "A" })
  examPart: string;

  @Column({ nullable: true })
  parentId: string;

  @Column({ nullable: true, type: "text" })
  displayText: string;

  @Column({ nullable: true, type: "text" })
  description: string;

  @Column({ type: "int" })
  orderNumber: number;

  @Column({ type: "int", default: 1 })
  points: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isComplex: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => QuestionOption, (option) => option.question)
  options: QuestionOption[];

  @OneToMany(() => UserAnswer, (userAnswer) => userAnswer.question)
  userAnswers: UserAnswer[];
}
