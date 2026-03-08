
import { supabase } from './supabaseClient';
import { Question, QuizPacket, StudentResult, TeacherProfile, StudentProfile, Achievement, LearningStyle, DifferentiationMode, Difficulty, AchievementType } from '../types';

// This service mirrors StorageService but uses Supabase (Async)
export const SupabaseService = {
  // --- QUESTIONS ---
  getQuestions: async (teacherId?: string): Promise<Question[]> => {
    let query = supabase.from('questions').select('*');
    if (teacherId) query = query.eq('teacher_id', teacherId);
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Map snake_case to camelCase if needed, or adjust types
    return data.map((q: any) => ({
        id: q.id,
        teacherId: q.teacher_id,
        topic: q.topic,
        indicator: q.indicator,
        difficulty: q.difficulty as Difficulty,
        text: q.text,
        imageUrl: q.image_url,
        options: q.options,
        correctIndex: q.correct_index,
        explanation: q.explanation,
        createdAt: new Date(q.created_at).getTime()
    }));
  },

  saveQuestion: async (question: Question) => {
    const { error } = await supabase.from('questions').upsert({
        id: question.id,
        teacher_id: question.teacherId,
        topic: question.topic,
        indicator: question.indicator,
        difficulty: question.difficulty,
        text: question.text,
        image_url: question.imageUrl,
        options: question.options,
        correct_index: question.correctIndex,
        explanation: question.explanation,
        created_at: new Date(question.createdAt || Date.now()).toISOString()
    });
    if (error) throw error;
  },

  deleteQuestion: async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;
  },

  // --- PACKETS ---
  getPackets: async (teacherId?: string): Promise<QuizPacket[]> => {
    let query = supabase.from('packets').select('*');
    if (teacherId) query = query.eq('teacher_id', teacherId);
    
    const { data, error } = await query;
    if (error) throw error;

    return data.map((p: any) => ({
        id: p.id,
        teacherId: p.teacher_id,
        name: p.name,
        questions: p.questions, // JSONB
        modules: p.modules, // JSONB
        learningMaterials: p.learning_materials, // JSONB
        createdAt: new Date(p.created_at).getTime(),
        differentiationMode: p.differentiation_mode as DifferentiationMode
    }));
  },

  savePacket: async (packet: QuizPacket) => {
    const { error } = await supabase.from('packets').upsert({
        id: packet.id,
        teacher_id: packet.teacherId,
        name: packet.name,
        questions: packet.questions,
        modules: packet.modules,
        learning_materials: packet.learningMaterials,
        created_at: new Date(packet.createdAt).toISOString(),
        differentiation_mode: packet.differentiationMode
    });
    if (error) throw error;
  },

  deletePacket: async (id: string) => {
    const { error } = await supabase.from('packets').delete().eq('id', id);
    if (error) throw error;
  },

  // --- RESULTS ---
  getResults: async (studentId?: string): Promise<StudentResult[]> => {
    let query = supabase.from('results').select('*');
    if (studentId) query = query.eq('student_id', studentId);
    
    const { data, error } = await query;
    if (error) throw error;

    return data.map((r: any) => ({
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        className: r.class_name,
        packetId: r.packet_id,
        score: r.score,
        abilityLevel: r.ability_level,
        answers: r.answers,
        selectedIndices: r.selected_indices,
        attemptNumber: r.attempt_number,
        timestamp: new Date(r.created_at).getTime()
    }));
  },

  saveResult: async (result: StudentResult) => {
    const { error } = await supabase.from('results').insert({
        id: result.id,
        student_id: result.studentId,
        student_name: result.studentName,
        class_name: result.className,
        packet_id: result.packetId,
        score: result.score,
        ability_level: result.abilityLevel,
        answers: result.answers,
        selected_indices: result.selectedIndices,
        attempt_number: result.attemptNumber,
        created_at: new Date(result.timestamp).toISOString()
    });
    if (error) throw error;
  },

  // --- USERS (Simplified for Demo) ---
  // In real Supabase, use Supabase Auth for login/register
  loginUser: async (email: string, password: string) => {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email,
          password
      });
      
      if (error) return { success: false, message: error.message };
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
        
      return { 
          success: true, 
          role: profile?.role, 
          user: { ...user, ...profile }, 
          message: 'Login Berhasil' 
      };
  }
};
