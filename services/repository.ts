
import { STORAGE_KEYS } from '../constants';
import { Question, QuizPacket, StudentResult, TeacherProfile, StudentProfile, Achievement } from '../types';

/**
 * BaseRepository
 * Helper internal untuk menangani operasi JSON parsing dan localStorage secara aman.
 */
class BaseRepository<T> {
    constructor(private storageKey: string) {}

    getAll(): T[] {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    saveAll(data: T[]): void {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
    
    add(item: T): void {
        const items = this.getAll();
        items.push(item);
        this.saveAll(items);
    }
}

/**
 * UserRepository
 * Mengelola data Teacher dan Student.
 */
export const UserRepository = {
    teachers: new BaseRepository<TeacherProfile>(STORAGE_KEYS.TEACHERS),
    students: new BaseRepository<StudentProfile>(STORAGE_KEYS.STUDENTS),

    findTeacherByEmail: (email: string) => 
        UserRepository.teachers.getAll().find(t => t.email === email),
    
    findStudentByEmail: (email: string) => 
        UserRepository.students.getAll().find(s => s.email === email),
    
    updateStudent: (id: string, updates: Partial<StudentProfile>) => {
        const students = UserRepository.students.getAll();
        const idx = students.findIndex(s => s.id === id);
        if (idx !== -1) {
            students[idx] = { ...students[idx], ...updates };
            UserRepository.students.saveAll(students);
            return students[idx];
        }
        return null;
    }
};

/**
 * QuizRepository
 * Mengelola data Soal dan Paket Kuis.
 */
export const QuizRepository = {
    questions: new BaseRepository<Question>(STORAGE_KEYS.QUESTIONS),
    packets: new BaseRepository<QuizPacket>(STORAGE_KEYS.PACKETS),

    getPacketById: (id: string) => 
        QuizRepository.packets.getAll().find(p => p.id === id),
};

/**
 * ResultRepository
 * Mengelola hasil tes siswa.
 */
export const ResultRepository = {
    results: new BaseRepository<StudentResult>(STORAGE_KEYS.RESULTS),
    
    getByStudentId: (studentId: string) => 
        ResultRepository.results.getAll().filter(r => r.studentId === studentId)
};

/**
 * AchievementRepository
 * Mengelola data prestasi/gamifikasi.
 */
export const AchievementRepository = {
    achievements: new BaseRepository<Achievement>(STORAGE_KEYS.ACHIEVEMENTS),
};
