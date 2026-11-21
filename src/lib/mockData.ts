/**
 * Type re-exports and placeholder fixtures
 * Real data is loaded dynamically from Supabase database.
 */

export * from '@/types';

import type {
  Profile,
  Coach,
  Student,
  ClassSession,
  Fee,
  FinanceTransaction,
  Registration,
  Notification,
  StudentAttendance,
  BeltExam,
  ExamParticipant,
  Tournament,
  TournamentParticipant,
  ClassStudentEnrollment,
  CurriculumMaterial,
} from '@/types';

// Legacy fallback fixtures (retained for backward compatibility)
export const initialProfiles: Profile[] = [];
export const initialCoaches: Coach[] = [];
export const initialStudents: Student[] = [];
export const initialClasses: ClassSession[] = [];
export const initialFees: Fee[] = [];
export const initialFinanceTransactions: FinanceTransaction[] = [];
export const initialRegistrations: Registration[] = [];
export const initialNotifications: Notification[] = [];
export const initialAttendanceStudents: StudentAttendance[] = [];
export const initialBeltExams: BeltExam[] = [];
export const initialExamParticipants: ExamParticipant[] = [];
export const initialTournaments: Tournament[] = [];
export const initialTournamentParticipants: TournamentParticipant[] = [];
export const initialClassStudents: ClassStudentEnrollment[] = [];
export const initialCurriculumMaterials: CurriculumMaterial[] = [];
