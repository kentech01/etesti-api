import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Exam } from "./Exam";
import { Subject } from "./Subject";

@Entity("sectors")
export class Sector {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  displayName: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Exam, (exam) => exam.sector)
  exams: Exam[];

  @OneToMany(() => Subject, (subject) => subject.sector)
  subjects: Subject[];
}
