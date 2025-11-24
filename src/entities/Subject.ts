import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from "typeorm";
import { Sector } from "./Sector";
import { Question } from "./Question";

@Entity("subjects")
@Unique(["value", "sectorId"])
export class Subject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  label: string;

  @Column()
  value: string;

  @Column()
  sectorId: string;

  @ManyToOne(() => Sector, (sector) => sector.subjects)
  @JoinColumn({ name: "sectorId" })
  sector: Sector;

  @OneToMany(() => Question, (question) => question.subject)
  questions: Question[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
