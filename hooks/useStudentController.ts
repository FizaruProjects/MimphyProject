import React, { useState, useEffect } from 'react';
import { UserSession, QuizPacket, StudentResult, Achievement } from '../types';
import { QuizService } from '../services/quizService';
import { UserRepository, QuizRepository, AchievementRepository, ResultRepository } from '../services/repository';
import { generateLearningModule } from '../services/geminiService';

export type ViewState = 'dashboard' | 'input_code' | 'quiz' | 'result';

/**
 * useStudentController
 * Custom Hook yang bertindak sebagai "Controller" untuk StudentDashboard.
 * Mengembalikan semua state dan fungsi handler yang dibutuhkan oleh View.
 */
export const useStudentController = (session: UserSession, onLogout: () => void) => {
    // --- STATE ---
    const [view, setView] = useState<ViewState>('dashboard');
    const [packetCode, setPacketCode] = useState('');
    const [activePacket, setActivePacket] = useState<QuizPacket | null>(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [doubtfulQuestions, setDoubtfulQuestions] = useState<boolean[]>([]);
    const [result, setResult] = useState<StudentResult | null>(null);
    const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<Achievement[]>([]);
    
    // Profile & Stats State
    const [currentPhoto, setCurrentPhoto] = useState<string | undefined>(session.photoUrl);
    const [stats, setStats] = useState({ totalPackets: 0, avgScore: 0 });
    const [achievements, setAchievements] = useState<{my: string[], all: Achievement[]}>({ my: [], all: [] });
    const [availablePacketsCount, setAvailablePacketsCount] = useState(0);

    // Module State
    const [moduleState, setModuleState] = useState<{
        aiContent: string | null,
        pdfUrl: string | null,
        loading: boolean,
        isTeacher: boolean
    }>({ aiContent: null, pdfUrl: null, loading: false, isTeacher: false });

    // --- EFFECTS ---
    useEffect(() => {
        refreshDashboardData();
    }, [session.userId]);

    // --- DATA LOADERS ---
    const refreshDashboardData = () => {
        if (!session.userId) return;

        // Load Stats
        const myResults = ResultRepository.getByStudentId(session.userId);
        const total = myResults.length;
        const avg = total > 0 ? Math.round(myResults.reduce((a,b) => a + b.score, 0) / total) : 0;
        setStats({ totalPackets: total, avgScore: avg });

        // Load Achievements
        const student = UserRepository.students.getAll().find(s => s.id === session.userId);
        const allAch = AchievementRepository.achievements.getAll();
        setAchievements({ 
            my: student?.unlockedAchievements || [], 
            all: allAch 
        });

        // Load Packet Count
        setAvailablePacketsCount(QuizRepository.packets.getAll().length);
    };

    // --- ACTIONS (HANDLERS) ---
    
    const handlers = {
        goHome: () => {
            setView('dashboard');
            setResult(null);
            setActivePacket(null);
            refreshDashboardData();
        },

        handleLogoutConfirm: () => {
            if(confirm("Apakah Anda yakin ingin Logout dari akun ini?")) {
                onLogout();
            }
        },

        handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file && session.userId) {
                if (file.size > 500000) { 
                    alert("⚠️ Ukuran foto terlalu besar. Maksimal 500KB.");
                    return;
                }
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const base64 = reader.result as string;
                    UserRepository.updateStudent(session.userId!, { photoUrl: base64 });
                    setCurrentPhoto(base64);
                };
            }
        },

        startQuiz: () => {
            const code = packetCode.trim().toUpperCase();
            if (!code) { alert("Mohon masukkan kode paket."); return; }

            const packet = QuizService.findPacket(code);
            
            if (packet) {
                if (packet.questions.length === 0) { alert("Maaf, paket kosong."); return; }
                
                // Reset Quiz State
                setActivePacket(packet);
                setCurrentQIndex(0);
                setUserAnswers(new Array(packet.questions.length).fill(-1));
                setDoubtfulQuestions(new Array(packet.questions.length).fill(false)); 
                setResult(null);
                setModuleState({ aiContent: null, pdfUrl: null, loading: false, isTeacher: false });
                setNewlyUnlockedAchievements([]);
                setView('quiz');
            } else {
                alert("Kode Paket tidak ditemukan!");
            }
        },

        answerQuestion: (idx: number, answerIdx: number) => {
            const newAns = [...userAnswers];
            newAns[idx] = answerIdx;
            setUserAnswers(newAns);
        },

        toggleDoubt: (idx: number) => {
            const newDoubt = [...doubtfulQuestions];
            newDoubt[idx] = !newDoubt[idx];
            setDoubtfulQuestions(newDoubt);
        },

        finishQuiz: () => {
            if (!activePacket) return;
            const unanswered = userAnswers.filter(a => a === -1).length;
            if (unanswered > 0 && !confirm(`Masih ada ${unanswered} soal belum dijawab. Selesaikan?`)) return;

            // Call Service to Calculate
            const { result: newResult, newAchievements } = QuizService.calculateResult(activePacket, userAnswers, session);
            
            setResult(newResult);
            setNewlyUnlockedAchievements(newAchievements);
            setView('result');
        },

        generateModule: async () => {
            if (!result || !activePacket) return;
            
            setModuleState(prev => ({ ...prev, loading: true, aiContent: null, pdfUrl: null }));

            // 1. Cek PDF Guru
            if (activePacket.pdfModules) {
                let pdf = null;
                if (result.abilityLevel === 'Dasar') pdf = activePacket.pdfModules.basic;
                else if (result.abilityLevel === 'Sedang') pdf = activePacket.pdfModules.medium;
                else if (result.abilityLevel === 'Tinggi') pdf = activePacket.pdfModules.high;

                if (pdf) {
                    setModuleState({ aiContent: null, pdfUrl: pdf, loading: false, isTeacher: true });
                    return;
                }
            }

            // 2. Fallback ke AI
            const topic = activePacket.questions[0]?.topic || "Fisika SMA";
            const content = await generateLearningModule(topic, result.abilityLevel);
            setModuleState({ aiContent: content, pdfUrl: null, loading: false, isTeacher: false });
        },
        
        // Setter helpers
        setPacketCode,
        setCurrentQIndex,
        setView
    };

    return {
        state: {
            view, packetCode, activePacket, currentQIndex, userAnswers, doubtfulQuestions,
            result, newlyUnlockedAchievements, currentPhoto, stats, achievements,
            availablePacketsCount, moduleState
        },
        handlers
    };
};