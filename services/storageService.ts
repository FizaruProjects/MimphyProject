
import { Question, QuizPacket, StudentResult, Difficulty, LearningModule, TeacherProfile, StudentProfile, Achievement, AchievementType, LearningStyle, DifferentiationMode } from '../types';

const KEYS = {
  QUESTIONS: 'fp_questions',
  PACKETS: 'fp_packets',
  RESULTS: 'fp_results',
  MODULES: 'fp_modules',
  TEACHERS: 'fp_users', 
  STUDENTS: 'fp_students',
  ACHIEVEMENTS: 'fp_achievements' // NEW KEY
};

// --- SEED DATA ---
const SEED_QUESTIONS: Question[] = [
  {
    id: 'q1',
    teacherId: 'demo-teacher',
    topic: 'Hukum Newton II',
    difficulty: Difficulty.EASY,
    text: 'Sebuah benda bermassa 5 kg ditarik dengan gaya sebesar 20 N di atas lantai licin. Berapakah percepatan yang dialami benda tersebut?',
    options: ['2 m/s²', '4 m/s²', '10 m/s²', '100 m/s²', '20 m/s²'],
    correctIndex: 1,
    explanation: 'Menggunakan rumus F = m.a, maka a = F/m = 20 N / 5 kg = 4 m/s².'
  },
];

const SEED_PACKETS: QuizPacket[] = [
  {
    id: 'FIS-DEMO',
    teacherId: 'demo-teacher',
    name: 'Latihan Fisika Dasar (Demo)',
    questions: SEED_QUESTIONS,
    createdAt: Date.now(),
    differentiationMode: DifferentiationMode.CONTENT
  }
];

const SEED_TEACHERS: TeacherProfile[] = [
    {
        id: 'demo-teacher',
        name: 'Guru Demo',
        email: 'guru@sekolah.id',
        passwordHash: 'cGFzc3dvcmQ=', // base64 of 'password'
        subject: 'Fisika',
        isActive: true,
        joinedAt: Date.now()
    }
];

const SEED_STUDENTS: StudentProfile[] = [
    {
        id: 'demo-student',
        name: 'Siswa Demo',
        email: 'siswa@sekolah.id',
        className: 'XII IPA 1',
        schoolName: 'SMA Negeri 1 Demo',
        passwordHash: 'cGFzc3dvcmQ=', // base64 of 'password'
        isActive: true,
        joinedAt: Date.now(),
        unlockedAchievements: [],
        learningStyle: LearningStyle.VISUAL
    }
];

const SEED_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'ach-1',
        title: 'Langkah Pertama',
        description: 'Selesaikan 1 Paket Soal',
        type: AchievementType.TOTAL_PACKETS,
        targetValue: 1,
    },
    {
        id: 'ach-2',
        title: 'Siswa Teladan',
        description: 'Capai Rata-rata Nilai 80',
        type: AchievementType.AVG_SCORE,
        targetValue: 80,
    },
    {
        id: 'ach-3',
        title: 'Master Fisika',
        description: 'Dapatkan Nilai 100 Sempurna',
        type: AchievementType.PERFECT_SCORE,
        targetValue: 100,
    }
];

// Inisialisasi data
const initializeData = () => {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(KEYS.QUESTIONS)) localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(SEED_QUESTIONS));
    if (!localStorage.getItem(KEYS.PACKETS)) localStorage.setItem(KEYS.PACKETS, JSON.stringify(SEED_PACKETS));
    if (!localStorage.getItem(KEYS.TEACHERS)) localStorage.setItem(KEYS.TEACHERS, JSON.stringify(SEED_TEACHERS));
    if (!localStorage.getItem(KEYS.STUDENTS)) localStorage.setItem(KEYS.STUDENTS, JSON.stringify(SEED_STUDENTS));
    if (!localStorage.getItem(KEYS.ACHIEVEMENTS)) localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(SEED_ACHIEVEMENTS));
};

initializeData();

export const StorageService = {
  // --- QUESTIONS ---
  getQuestions: (teacherId?: string): Question[] => {
    const data = localStorage.getItem(KEYS.QUESTIONS);
    let questions: Question[] = data ? JSON.parse(data) : [];
    if (teacherId) questions = questions.filter(q => q.teacherId === teacherId);
    return questions;
  },

  saveQuestion: (question: Question) => {
    const questions = StorageService.getQuestions(); 
    const index = questions.findIndex(q => q.id === question.id);
    
    if (!question.createdAt) question.createdAt = Date.now();

    if (index >= 0) questions[index] = question;
    else questions.push(question);
    localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(questions));
  },

  deleteQuestion: (id: string) => {
    const questions = StorageService.getQuestions();
    const newQuestions = questions.filter(q => q.id !== id);
    localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(newQuestions));
  },

  // --- PACKETS ---
  getPackets: (teacherId?: string): QuizPacket[] => {
    const data = localStorage.getItem(KEYS.PACKETS);
    let packets: QuizPacket[] = data ? JSON.parse(data) : [];
    if (teacherId) packets = packets.filter(p => p.teacherId === teacherId);
    return packets;
  },

  savePacket: (packet: QuizPacket) => {
    const packets = StorageService.getPackets();
    localStorage.setItem(KEYS.PACKETS, JSON.stringify([...packets, packet]));
  },
  
  updatePacket: (packet: QuizPacket) => {
    const packets = StorageService.getPackets();
    const index = packets.findIndex(p => p.id === packet.id);
    if (index >= 0) {
        packets[index] = packet;
        localStorage.setItem(KEYS.PACKETS, JSON.stringify(packets));
    }
  },

  deletePacket: (id: string) => {
      const packets = StorageService.getPackets();
      const newPackets = packets.filter(p => p.id !== id);
      localStorage.setItem(KEYS.PACKETS, JSON.stringify(newPackets));
  },

  hasPacketResults: (packetId: string): boolean => {
      const results = StorageService.getResults();
      return results.some(r => r.packetId === packetId);
  },

  // --- ACHIEVEMENTS (NEW) ---
  getAchievements: (): Achievement[] => {
      const data = localStorage.getItem(KEYS.ACHIEVEMENTS);
      return data ? JSON.parse(data) : [];
  },

  saveAchievement: (achievement: Achievement) => {
      const list = StorageService.getAchievements();
      list.push(achievement);
      localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(list));
  },

  deleteAchievement: (id: string) => {
      const list = StorageService.getAchievements();
      const newList = list.filter(a => a.id !== id);
      localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(newList));
  },

  // Logic to evaluate if a student unlocked new achievements
  evaluateAchievements: (studentId: string): Achievement[] => {
      const students = StorageService.getStudents();
      const studentIndex = students.findIndex(s => s.id === studentId);
      if (studentIndex < 0) return [];
      const student = students[studentIndex];

      const allResults = StorageService.getResults().filter(r => r.studentId === studentId);
      
      // LOGIKA DE-DUPLIKASI: Ambil nilai TERBAIK per paket untuk perhitungan statistik
      const bestResultsMap = new Map<string, StudentResult>();
      allResults.forEach(r => {
          if (!bestResultsMap.has(r.packetId) || r.score > bestResultsMap.get(r.packetId)!.score) {
              bestResultsMap.set(r.packetId, r);
          }
      });
      const bestResults = Array.from(bestResultsMap.values());

      const allAchievements = StorageService.getAchievements();
      const newUnlocked: Achievement[] = [];
      const currentUnlockedIds = new Set(student.unlockedAchievements || []);

      // Calc Stats based on BEST results
      const totalPackets = bestResults.length;
      const avgScore = totalPackets > 0 
          ? bestResults.reduce((acc, curr) => acc + curr.score, 0) / totalPackets 
          : 0;
      
      // Perfect scores count (bisa dihitung dari total history atau best, tergantung aturan. Kita pakai best)
      const perfectScores = bestResults.filter(r => r.score === 100).length;

      allAchievements.forEach(ach => {
          if (currentUnlockedIds.has(ach.id)) return; // Already unlocked

          let unlocked = false;
          if (ach.type === AchievementType.TOTAL_PACKETS && totalPackets >= ach.targetValue) unlocked = true;
          if (ach.type === AchievementType.AVG_SCORE && totalPackets > 0 && avgScore >= ach.targetValue) unlocked = true;
          if (ach.type === AchievementType.PERFECT_SCORE && perfectScores >= 1) unlocked = true;

          if (unlocked) {
              newUnlocked.push(ach);
              currentUnlockedIds.add(ach.id);
          }
      });

      if (newUnlocked.length > 0) {
          student.unlockedAchievements = Array.from(currentUnlockedIds);
          students[studentIndex] = student;
          localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
      }

      return newUnlocked;
  },

  // --- RESULTS ---
  getResults: (): StudentResult[] => {
    const data = localStorage.getItem(KEYS.RESULTS);
    const results = data ? JSON.parse(data) : [];
    // Migration helper: If selectedIndices missing, map answers to rough indices (-1 for false, just to prevent crash, though inaccurate)
    return results.map((r: any) => ({
        ...r,
        attemptNumber: r.attemptNumber || 1, // Fallback for old data
        selectedIndices: r.selectedIndices || r.answers.map((ans: boolean) => ans ? 1 : 0) // Fallback safe
    }));
  },

  saveResult: (result: StudentResult): Achievement[] => {
    const results = StorageService.getResults();
    
    // Hitung Attempt Number
    const previousAttempts = results.filter(r => r.studentId === result.studentId && r.packetId === result.packetId);
    result.attemptNumber = previousAttempts.length + 1;

    localStorage.setItem(KEYS.RESULTS, JSON.stringify([...results, result]));
    
    // Trigger Achievement Check
    return StorageService.evaluateAchievements(result.studentId);
  },

  // --- TEACHERS ---
  getTeachers: (): TeacherProfile[] => {
      const data = localStorage.getItem(KEYS.TEACHERS);
      return data ? JSON.parse(data) : [];
  },

  registerTeacher: (name: string, email: string, password: string, subject: string): {success: boolean, message: string} => {
      const users = StorageService.getTeachers();
      if (users.find(u => u.email === email)) return { success: false, message: 'Email sudah terdaftar.' };
      
      const newUser: TeacherProfile = {
          id: `T-${Date.now()}`,
          name, email, subject,
          passwordHash: btoa(password),
          isActive: true,
          joinedAt: Date.now()
      };
      
      users.push(newUser);
      localStorage.setItem(KEYS.TEACHERS, JSON.stringify(users));
      return { success: true, message: 'Registrasi berhasil. Silakan login.' };
  },

  updateTeacherStatus: (id: string, isActive: boolean) => {
      const users = StorageService.getTeachers();
      const index = users.findIndex(u => u.id === id);
      if (index >= 0) {
          users[index].isActive = isActive;
          localStorage.setItem(KEYS.TEACHERS, JSON.stringify(users));
      }
  },

  updateTeacherProfile: (id: string, updates: Partial<TeacherProfile>): TeacherProfile | null => {
      const users = StorageService.getTeachers();
      const index = users.findIndex(u => u.id === id);
      if (index >= 0) {
          users[index] = { ...users[index], ...updates };
          localStorage.setItem(KEYS.TEACHERS, JSON.stringify(users));
          return users[index];
      }
      return null;
  },

  resetTeacherPassword: (id: string, newPassword?: string): boolean => {
      const users = StorageService.getTeachers();
      const index = users.findIndex(u => u.id === id);
      if (index >= 0) {
          users[index].passwordHash = btoa(newPassword || '123456');
          localStorage.setItem(KEYS.TEACHERS, JSON.stringify(users));
          return true;
      }
      return false;
  },

  // --- STUDENTS ---
  getStudents: (): StudentProfile[] => {
      const data = localStorage.getItem(KEYS.STUDENTS);
      return data ? JSON.parse(data) : [];
  },

  registerStudent: (name: string, email: string, className: string, schoolName: string, password: string, learningStyle: LearningStyle = LearningStyle.VISUAL): {success: boolean, message: string} => {
      const students = StorageService.getStudents();
      if (students.find(s => s.email === email)) return { success: false, message: 'Email siswa sudah terdaftar.' };

      const newStudent: StudentProfile = {
          id: `S-${Date.now()}`,
          name, email, className, schoolName,
          passwordHash: btoa(password),
          isActive: true,
          joinedAt: Date.now(),
          unlockedAchievements: [],
          learningStyle: learningStyle
      };

      students.push(newStudent);
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
      return { success: true, message: 'Akun siswa berhasil dibuat.' };
  },

  updateStudentStatus: (id: string, isActive: boolean) => {
      const students = StorageService.getStudents();
      const index = students.findIndex(s => s.id === id);
      if (index >= 0) {
          students[index].isActive = isActive;
          localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
      }
  },

  resetStudentPassword: (id: string, newPassword?: string): boolean => {
      const students = StorageService.getStudents();
      const index = students.findIndex(s => s.id === id);
      if (index >= 0) {
          students[index].passwordHash = btoa(newPassword || '123456');
          localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
          return true;
      }
      return false;
  },

  updateStudentProfile: (id: string, updates: Partial<StudentProfile>): StudentProfile | null => {
      const students = StorageService.getStudents();
      const index = students.findIndex(s => s.id === id);
      if (index >= 0) {
          students[index] = { ...students[index], ...updates };
          localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
          return students[index];
      }
      return null;
  },

  loginUser: (email: string, password: string): {success: boolean, role?: 'admin'|'teacher'|'student', user?: any, message: string} => {
      if (email === 'admin@sekolah.id' && password === 'admin123') {
          return { success: true, role: 'admin', message: 'Login Admin Berhasil' };
      }
      const teachers = StorageService.getTeachers();
      const teacher = teachers.find(t => t.email === email && t.passwordHash === btoa(password));
      if (teacher) {
          if (!teacher.isActive) return { success: false, message: 'Akun Guru dinonaktifkan Admin.' };
          return { success: true, role: 'teacher', user: teacher, message: 'Login Guru Berhasil' };
      }
      const students = StorageService.getStudents();
      const student = students.find(s => s.email === email && s.passwordHash === btoa(password));
      if (student) {
          if (!student.isActive) return { success: false, message: 'Akun Siswa dinonaktifkan Admin.' };
          return { success: true, role: 'student', user: student, message: 'Login Siswa Berhasil' };
      }
      return { success: false, message: 'Email atau password salah.' };
  }
};
