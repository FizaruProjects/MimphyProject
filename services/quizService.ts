
import { QuizRepository, ResultRepository, AchievementRepository, UserRepository } from './repository';
import { QuizPacket, StudentResult, AbilityLevel, AchievementType, Achievement } from '../types';
import { DEFAULT_VALUES } from '../constants';

/**
 * QuizService
 * Menangani logika "Core" dari aplikasi: Mengerjakan kuis dan menghitung hasil.
 */
export const QuizService = {
    /**
     * Mencari paket soal berdasarkan kode.
     */
    findPacket: (code: string): QuizPacket | null => {
        return QuizRepository.getPacketById(code) || null;
    },

    /**
     * Menghitung nilai akhir dan menentukan level kemampuan.
     * Logika Penting: Level ditentukan berdasarkan threshold nilai (85, 70).
     */
    calculateResult: (packet: QuizPacket, userAnswers: number[], session: any): { result: StudentResult, newAchievements: Achievement[] } => {
        let correctCount = 0;
        const boolAnswers: boolean[] = [];

        packet.questions.forEach((q, idx) => {
            const isCorrect = userAnswers[idx] === q.correctIndex;
            if (isCorrect) correctCount++;
            boolAnswers.push(isCorrect);
        });

        const finalScore = Math.round((correctCount / packet.questions.length) * 100);
        
        // Tentukan Level
        let level = AbilityLevel.BASIC;
        if (finalScore >= DEFAULT_VALUES.PASS_SCORE_HIGH) level = AbilityLevel.HIGH;
        else if (finalScore >= DEFAULT_VALUES.PASS_SCORE_MEDIUM) level = AbilityLevel.MEDIUM;

        // Calculate Attempt Number
        const studentId = session.userId || 'guest';
        const previousResults = ResultRepository.getByStudentId(studentId).filter(r => r.packetId === packet.id);
        const attemptNumber = previousResults.length + 1;

        const newResult: StudentResult = {
            id: Date.now().toString(),
            studentId: studentId,
            studentName: session.name || 'Anonim',
            className: session.className || '-',
            packetId: packet.id,
            score: finalScore,
            abilityLevel: level,
            answers: boolAnswers,
            selectedIndices: userAnswers,
            attemptNumber: attemptNumber,
            timestamp: Date.now()
        };

        // Simpan Hasil
        ResultRepository.results.add(newResult);

        // Cek Achievement
        const newAchievements = GamificationService.evaluateAchievements(session.userId);

        return { result: newResult, newAchievements };
    }
};

/**
 * GamificationService (Sub-service)
 * Khusus menangani logika achievement.
 */
const GamificationService = {
    evaluateAchievements: (studentId: string): Achievement[] => {
        const allResults = ResultRepository.getByStudentId(studentId);
        const allAchievements = AchievementRepository.achievements.getAll();
        const students = UserRepository.students.getAll();
        const studentIndex = students.findIndex(s => s.id === studentId);
        
        if (studentIndex === -1) return [];

        const student = students[studentIndex];
        const unlockedIds = new Set(student.unlockedAchievements || []);
        const newlyUnlocked: Achievement[] = [];

        // Hitung Statistik
        const totalPackets = allResults.length;
        const avgScore = totalPackets > 0 
            ? allResults.reduce((a, b) => a + b.score, 0) / totalPackets 
            : 0;
        const perfectScores = allResults.filter(r => r.score === 100).length;

        // Evaluasi Rules
        allAchievements.forEach(ach => {
            if (unlockedIds.has(ach.id)) return; // Skip jika sudah punya

            let earned = false;
            if (ach.type === AchievementType.TOTAL_PACKETS && totalPackets >= ach.targetValue) earned = true;
            if (ach.type === AchievementType.AVG_SCORE && avgScore >= ach.targetValue) earned = true;
            if (ach.type === AchievementType.PERFECT_SCORE && perfectScores >= 1) earned = true;

            if (earned) {
                newlyUnlocked.push(ach);
                unlockedIds.add(ach.id);
            }
        });

        // Update Student Profile jika ada achievement baru
        if (newlyUnlocked.length > 0) {
            student.unlockedAchievements = Array.from(unlockedIds);
            UserRepository.updateStudent(student.id, { unlockedAchievements: Array.from(unlockedIds) });
        }

        return newlyUnlocked;
    }
};
