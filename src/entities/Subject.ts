import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
  Unique,
} from "typeorm";
import { Sector } from "./Sector";
import { Question } from "./Question";

@Entity("subjects")
@Unique(["value"])
export class Subject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  label: string;

  @Column({ unique: true })
  value: string;

  @ManyToMany(() => Sector, (sector) => sector.subjects)
  @JoinTable({
    name: "subject_sectors",
    joinColumn: { name: "subjectId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "sectorId", referencedColumnName: "id" },
  })
  sectors: Sector[];

  @OneToMany(() => Question, (question) => question.subject)
  questions: Question[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
