
import { UserRepository } from './repository';
import { ROLES } from '../constants';
import { UserSession, LearningStyle } from '../types';

/**
 * AuthService
 * Menangani logika bisnis autentikasi.
 * Input: Email, Password, Data Registrasi.
 * Output: Status sukses/gagal, Data sesi user.
 */
export const AuthService = {
    /**
     * Melakukan validasi login untuk semua role.
     */
    login: (email: string, pass: string) => {
        // 1. Cek Admin
        if (email === 'admin@sekolah.id' && pass === 'admin123') {
            return { success: true, role: ROLES.ADMIN, message: 'Login Admin Berhasil' };
        }

        const hashedPass = btoa(pass); // Simple mock hashing

        // 2. Cek Teacher
        const teacher = UserRepository.findTeacherByEmail(email);
        if (teacher && teacher.passwordHash === hashedPass) {
            if (!teacher.isActive) return { success: false, message: 'Akun Guru dinonaktifkan.' };
            return { success: true, role: ROLES.TEACHER, user: teacher, message: 'Login Guru Berhasil' };
        }

        // 3. Cek Student
        const student = UserRepository.findStudentByEmail(email);
        if (student && student.passwordHash === hashedPass) {
            if (!student.isActive) return { success: false, message: 'Akun Siswa dinonaktifkan.' };
            return { success: true, role: ROLES.STUDENT, user: student, message: 'Login Siswa Berhasil' };
        }

        return { success: false, message: 'Email atau password salah.' };
    },

    /**
     * Mendaftarkan siswa baru.
     */
    registerStudent: (name: string, email: string, className: string, schoolName: string, pass: string, learningStyle: LearningStyle = LearningStyle.VISUAL) => {
        if (UserRepository.findStudentByEmail(email)) {
            return { success: false, message: 'Email sudah terdaftar.' };
        }

        UserRepository.students.add({
            id: `S-${Date.now()}`,
            name, email, className, schoolName,
            passwordHash: btoa(pass),
            isActive: true,
            joinedAt: Date.now(),
            unlockedAchievements: [],
            learningStyle: learningStyle
        });

        return { success: true, message: 'Registrasi Berhasil' };
    },
    
    // ... Logika register guru bisa ditambahkan serupa di sini
};
