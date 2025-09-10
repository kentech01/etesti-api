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
import { Sector } from "./Sector";
import { Question } from "./Question";
import { UserAnswer } from "./UserAnswer";

@Entity("exams")
export class Exam {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column("text")
  description: string;

  @Column()
  sectorId: string;

  @ManyToOne(() => Sector, (sector) => sector.exams)
  @JoinColumn({ name: "sectorId" })
  sector: Sector;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: "int", default: 0 })
  totalQuestions: number;

  @Column({ type: "int", default: 0 })
  passingScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Question, (question) => question.exam)
  questions: Question[];

  @OneToMany(() => UserAnswer, (userAnswer) => userAnswer.exam)
  userAnswers: UserAnswer[];
}
