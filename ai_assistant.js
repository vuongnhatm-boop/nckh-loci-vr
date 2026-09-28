/**
 * AI TRỢ LÝ GIỌNG NÓI & BỘ NÃO LLM (GOOGLE GEMINI API)
 * Dành cho Cung Điện Ký Ức - Lịch Sử 12 (Method of Loci)
 * Tích hợp nhận diện Wake-Word "Hey Memory", Visualizer Plasma Ring & Điều hướng 3D tức thì.
 */
import './history_knowledge_base.js';

/**
 * QUẢN LÝ TIẾN TRÌNH & HỒ SƠ GHI NHỚ KHÔNG GIAN CỦA NGƯỜI DÙNG (SPATIAL LEARNING PROFILE)
 * Lưu trữ vĩnh viễn trong LocalStorage: số câu đã làm, chuỗi streak, độ chính xác,
 * danh sách mốc đã thuộc sâu (mastered), mốc đang ôn (reviewing), mốc yếu cần củng cố.
 */
export class UserProgressManager {
  constructor(storageKey = 'loci_user_learning_profile_v1') {
    this.storageKey = storageKey;
    this.profile = this.loadProfile();
  }

  loadProfile() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          totalQuestionsAnswered: parsed.totalQuestionsAnswered || 0,
          correctCount: parsed.correctCount || 0,
          currentStreak: parsed.currentStreak || 0,
          bestStreak: parsed.bestStreak || 0,
          lociStats: parsed.lociStats || {}, // { [locusId]: { attempts: 0, correct: 0, lastTested: null, status: 'unlearned' } }
          quizHistory: parsed.quizHistory || [],
          lastUpdated: parsed.lastUpdated || Date.now()
        };
      }
    } catch (e) {
      console.warn('Lỗi đọc learning profile:', e);
    }
    return {
      totalQuestionsAnswered: 0,
      correctCount: 0,
      currentStreak: 0,
      bestStreak: 0,
      lociStats: {},
      quizHistory: [],
      lastUpdated: Date.now()
    };
  }

  saveProfile() {
    try {
      this.profile.lastUpdated = Date.now();
      localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
    } catch (e) {
      console.warn('Lỗi lưu learning profile:', e);
    }
  }

  recordAnswer(locusId, isCorrect, details = {}) {
    this.profile.totalQuestionsAnswered++;
    if (isCorrect) {
      this.profile.correctCount++;
      this.profile.currentStreak++;
      if (this.profile.currentStreak > this.profile.bestStreak) {
        this.profile.bestStreak = this.profile.currentStreak;
      }
    } else {
      this.profile.currentStreak = 0;
    }

    if (locusId) {
      if (!this.profile.lociStats[locusId]) {
        this.profile.lociStats[locusId] = { attempts: 0, correct: 0, lastTested: null, status: 'unlearned' };
      }
      const st = this.profile.lociStats[locusId];
      st.attempts++;
      if (isCorrect) st.correct++;
      st.lastTested = Date.now();

      // Cập nhật mức độ thành thạo: đúng >= 2 lần và tỷ lệ >= 70% là đã thuộc sâu
      if (st.correct >= 2 && (st.correct / st.attempts) >= 0.7) {
        st.status = 'mastered';
      } else if (st.attempts > 0) {
        st.status = 'reviewing';
      }
    }

    this.profile.quizHistory.unshift({
      timestamp: Date.now(),
      locusId,
      isCorrect,
      question: details.question || '',
      chosenOption: details.chosenOption || '',
      correctOption: details.correctOption || ''
    });
    if (this.profile.quizHistory.length > 30) {
      this.profile.quizHistory.pop();
    }

    this.saveProfile();
    return this.getStatsSummary();
  }

  getStatsSummary(lociList = []) {
    const accuracy = this.profile.totalQuestionsAnswered > 0
      ? Math.round((this.profile.correctCount / this.profile.totalQuestionsAnswered) * 100)
      : 0;

    let masteredCount = 0;
    let reviewingCount = 0;
    let unlearnedCount = 0;

    lociList.forEach(l => {
      const st = this.profile.lociStats[l.id];
      if (st && st.status === 'mastered') masteredCount++;
      else if (st && st.status === 'reviewing') reviewingCount++;
      else unlearnedCount++;
    });

    return {
      totalAnswered: this.profile.totalQuestionsAnswered,
      correctCount: this.profile.correctCount,
      accuracy,
      currentStreak: this.profile.currentStreak,
      bestStreak: this.profile.bestStreak,
      masteredCount,
      reviewingCount,
      unlearnedCount,
      totalLoci: lociList.length
    };
  }

  getWeakLoci(lociList = []) {
    return lociList.filter(l => {
      const st = this.profile.lociStats[l.id];
      if (!st || st.attempts === 0) return true; // Chưa làm
      return (st.correct / st.attempts) < 0.65 || st.status === 'reviewing';
    });
  }

  getMasteredLoci(lociList = []) {
    return lociList.filter(l => {
      const st = this.profile.lociStats[l.id];
      return st && st.status === 'mastered';
    });
  }

  formatProfileForPrompt(lociList = []) {
    const stats = this.getStatsSummary(lociList);
    const weakList = this.getWeakLoci(lociList).map(l => `"${l.name}" tại ${l.locName}`).join(', ');
    const masteredList = this.getMasteredLoci(lociList).map(l => `"${l.name}" tại ${l.locName}`).join(', ');

    return `
- Tổng câu trắc nghiệm/khảo bài đã làm: ${stats.totalAnswered} (Đúng ${stats.correctCount}, Tỷ lệ chính xác: ${stats.accuracy}%)
- Chuỗi trả lời đúng liên tiếp hiện tại (Streak): ${stats.currentStreak} 🔥 (Kỷ lục: ${stats.bestStreak} 🏆)
- Các mốc đã thuộc vững sâu: ${masteredList || 'Chưa có mốc nào thuộc vững hoàn toàn, hãy chủ động khen ngợi và củng cố'}
- Các mốc còn yếu hoặc hay nhầm lẫn: ${weakList || 'Không có mốc nào quá yếu'}`;
  }

  resetProgress() {
    this.profile = {
      totalQuestionsAnswered: 0,
      correctCount: 0,
      currentStreak: 0,
      bestStreak: 0,
      lociStats: {},
      quizHistory: [],
      lastUpdated: Date.now()
    };
    this.saveProfile();
  }
}

export class LociAIAssistant {
  constructor(options = {}) {
    this.onAction = options.onAction || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.onMessage = options.onMessage || (() => {});
    this.onTranscript = options.onTranscript || (() => {});
    this.onWakeWord = options.onWakeWord || (() => {});
    this.getContext = options.getContext || (() => ({ lociList: [] }));
    this.progressManager = options.progressManager || new UserProgressManager();

    // API Configuration
    let storedKey = localStorage.getItem('loci_gemini_api_key');
    if (!storedKey || storedKey.includes('Ab8RN6') || storedKey.startsWith('AQ.')) {
      storedKey = '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';
      localStorage.setItem('loci_gemini_api_key', storedKey);
    }
    this.apiKey = storedKey;
    
    // Model 3 Flash mặc định: google/gemini-3.5-flash-lite (OpenRouter) / gemini-3.5-flash
    let savedModel = localStorage.getItem('loci_gemini_model');
    const resetModels = ['gemini-1.5-pro', '1.5', 'gemini-1.5-flash', 'gemini-3.5-flash', 'gemini-2.0-flash'];
    if (!savedModel || resetModels.some(m => savedModel === m)) {
      savedModel = 'google/gemini-3.5-flash-lite';
      localStorage.setItem('loci_gemini_model', savedModel);
    }
    this.modelName = savedModel;

    // Danh sách model ưu tiên: Model 3 Flash -> 2.5 Flash -> 2.0 Flash
    this.candidateModels = [
      'google/gemini-3.5-flash-lite',
      'google/gemini-3.7-flash',
      'google/gemini-3.8-flash',
      'google/gemini-2.5-flash',
      'gemini-3.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];

    // State: 'idle' | 'listening' | 'thinking' | 'speaking'
    this.state = 'idle';
    this.chatHistory = [];
    this.answerDepth = 'detailed'; // Luôn mặc định phân tích sâu, đầy đủ

    // Web Speech API
    this.recognition = null;
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.speechRate = parseFloat(localStorage.getItem('loci_speech_rate')) || 0.92;
    this.speechPitch = parseFloat(localStorage.getItem('loci_speech_pitch')) || 0.85; // Trầm hơn mặc định
    this.speechVolume = parseFloat(localStorage.getItem('loci_speech_volume')) || 1.0;
    this.preferredVoiceName = localStorage.getItem('loci_voice_name') || '';
    this.isListening = false;
    this.autoSendTimer = null;
    this.accumulatedTranscript = '';
    this.wakeWordListening = true;
    this.speechQueue = [];
    this.currentSpeechIndex = 0;

    // Audio TTS Fallback (Dành riêng cho Meta Quest 2 & Trình duyệt không có giọng vi-VN)
    this.audioPlayer = new Audio();
    this.audioQueue = [];
    this.isPlayingAudio = false;
    this.audioUnlocked = false;
    this.initAudioEvents();

    this.initSpeech();
  }

  /* --- BỘ PHÁT AUDIO TTS CHO META QUEST 2 & DỰ PHÒNG TRÌNH DUYỆT --- */
  initAudioEvents() {
    if (!this.audioPlayer) return;
    this.audioPlayer.addEventListener('ended', () => {
      this.playNextAudioChunk();
    });
    this.audioPlayer.addEventListener('error', (e) => {
      console.warn('Lỗi phát âm thanh Audio TTS chunk:', e);
      this.playNextAudioChunk();
    });
  }

  unlockAudio() {
    if (this.audioPlayer && !this.audioUnlocked) {
      try {
        this.audioPlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
        this.audioPlayer.play().then(() => {
          this.audioPlayer.pause();
          this.audioUnlocked = true;
          console.log('🔊 Đã mở khóa Audio TTS cho Meta Quest 2 / Trình duyệt.');
        }).catch(() => {});
      } catch (e) {}
    }
  }

  /* --- CẤU HÌNH API KEY & MÔ HÌNH --- */
  setApiKey(key) {
    this.apiKey = key.trim();
    localStorage.setItem('loci_gemini_api_key', this.apiKey);
  }

  getApiKey() {
    return this.apiKey;
  }

  setModel(model) {
    this.modelName = model;
    localStorage.setItem('loci_gemini_model', model);
  }

  setAnswerDepth(depth) {
    this.answerDepth = depth || 'detailed';
  }

  setSpeechRate(rate) {
    this.speechRate = parseFloat(rate) || 0.92;
    localStorage.setItem('loci_speech_rate', this.speechRate);
  }

  setSpeechPitch(pitch) {
    this.speechPitch = parseFloat(pitch) || 0.85;
    localStorage.setItem('loci_speech_pitch', this.speechPitch);
  }

  setSpeechVolume(volume) {
    this.speechVolume = parseFloat(volume) || 1.0;
    localStorage.setItem('loci_speech_volume', this.speechVolume);
  }

  setVoice(voice) {
    this.voice = voice;
    if (voice) {
      localStorage.setItem('loci_voice_name', voice.name);
      this.preferredVoiceName = voice.name;
    }
  }

  // Trả về danh sách giọng tiếng Việt có sẵn (lọc rõ ràng, không ngọng)
  getAvailableVietnameseVoices() {
    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    // Ưu tiên: Google Vi > Microsoft Vi > các giọng vi-VN khác
    const viVoices = voices.filter(v =>
      v.lang.startsWith('vi') || v.lang.toLowerCase().includes('vn')
    );
    // Sắp xếp: Google lên đầu (thường rõ nhất)
    viVoices.sort((a, b) => {
      const aScore = a.name.includes('Google') ? 3 : a.name.includes('Microsoft') ? 2 : 1;
      const bScore = b.name.includes('Google') ? 3 : b.name.includes('Microsoft') ? 2 : 1;
      return bScore - aScore;
    });
    return viVoices;
  }

  setState(newState) {
    this.state = newState;
    this.onStateChange(newState);
  }

  /* --- KHỞI TẠO WEB SPEECH API (STT & TTS) --- */
  initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'vi-VN';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (!currentText) return;

        const lower = currentText.toLowerCase();

        // 1. Kiểm tra Wake-Word "Hey Memory" / "Memory ơi" / "Hey Loci" ("lo-xi")
        const wakeWordPatterns = [
          'hey memory', 'hay memory', 'này memory', 'memory ơi', 'ê memory', 'memory',
          'hey loci', 'loci ơi', 'này loci', 'ê loci', 'ơi loci', 'chào loci', 'alo loci', 'gọi loci', 'bật loci',
          'hey lo-xi', 'hey lo xi', 'lo-xi ơi', 'lo xi ơi', 'loxi ơi', 'hey loxi',
          'lô xi ơi', 'lô-xi ơi', 'loki ơi', 'hey loki', 'ơi lo-xi', 'chào lo-xi'
        ];
        const hasWakeWord = wakeWordPatterns.some(w => lower.includes(w)) ||
          /\b(loci|lo-xi|loxi|lô xi)\b/i.test(lower);

        if (hasWakeWord && this.state !== 'listening') {
          console.log('✨ Phát hiện Wake-Word "Hey Memory" / "Loci ơi"!');
          this.setState('listening');
          this.onWakeWord();
        }

        // Báo cho UI hiển thị chữ đang nói theo thời gian thực
        this.onTranscript({
          text: currentText,
          isFinal: !!finalTranscript,
          state: this.state
        });

        // 2. Tự động gửi lệnh khi người dùng dứt lời (Auto-send on silence)
        if (this.state === 'listening') {
          this.accumulatedTranscript = currentText;

          if (this.autoSendTimer) clearTimeout(this.autoSendTimer);
          // Đặt độ trễ 1.2s không nói tiếp -> tự động chốt lệnh gửi
          this.autoSendTimer = setTimeout(() => {
            this.commitVoiceCommand();
          }, 1200);
        }
      };

      this.recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          console.warn('Microphone permission not granted:', event.error);
          this.wakeWordListening = false;
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('SpeechRecognition error:', event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.wakeWordListening && this.state !== 'speaking') {
          try {
            setTimeout(() => {
              if (this.wakeWordListening && !this.isListening && this.state !== 'speaking') {
                this.recognition.start();
              }
            }, 400);
          } catch (e) {}
        }
      };
    } else {
      console.warn('Trình duyệt không hỗ trợ Web SpeechRecognition.');
    }

    // 2. Speech Synthesis (Text to Speech tiếng Việt) - Chọn giọng tốt nhất
    if (this.synth) {
      const loadVoices = () => {
        const viVoices = this.getAvailableVietnameseVoices();
        if (viVoices.length === 0) return;

        // Nếu người dùng đã lưu giọng yêu thích -> dùng lại
        if (this.preferredVoiceName) {
          const saved = viVoices.find(v => v.name === this.preferredVoiceName);
          if (saved) { this.voice = saved; return; }
        }

        // Ưu tiên: giọng Google nữ tiếng Việt (rõ nhất, ít ngọng nhất)
        const googleFemale = viVoices.find(v =>
          v.name.includes('Google') && (v.name.includes('Female') || v.name.includes('Nữ') || !v.name.includes('Male'))
        );
        const googleAny = viVoices.find(v => v.name.includes('Google'));
        const msFemale = viVoices.find(v =>
          v.name.includes('Microsoft') && (v.name.includes('HoaiMy') || v.name.includes('Female'))
        );

        this.voice = googleFemale || googleAny || msFemale || viVoices[0] || null;
        console.log('🎤 Loci TTS giọng được chọn:', this.voice ? this.voice.name : 'Mặc định hệ thống');
      };
      loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
    }
  }

  startWakeWordListening() {
    this.wakeWordListening = true;
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (e) {}
    }
  }

  stopWakeWordListening() {
    this.wakeWordListening = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  toggleListening() {
    if (!this.recognition) {
      console.warn('Trình duyệt chưa hỗ trợ Micro nhận dạng giọng nói.');
      return;
    }
    if (this.state === 'listening') {
      this.commitVoiceCommand();
    } else {
      if (this.synth.speaking) this.synth.cancel();
      this.setState('listening');
      this.onWakeWord();
      this.accumulatedTranscript = '';
      if (!this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {}
      }
    }
  }

  commitVoiceCommand() {
    if (this.autoSendTimer) {
      clearTimeout(this.autoSendTimer);
      this.autoSendTimer = null;
    }

    let command = this.accumulatedTranscript.trim();
    this.accumulatedTranscript = '';

    if (!command) {
      if (this.state === 'listening') this.setState('idle');
      return;
    }

    // Lọc bỏ cụm wake-word ở đầu câu nói nếu có
    command = command.replace(/^(hey|hay|này|ê)\s+memory\s*(ơi)?/i, '')
                     .replace(/^memory\s*(ơi)?/i, '')
                     .replace(/^(hey|hay)\s+(loci|lo-xi|lo\s+xi|loxi|lô\s*xi)\s*(ơi)?/i, '')
                     .replace(/^(loci|lo-xi|lo\s+xi|loxi|lô\s*xi)\s*(ơi)?/i, '')
                     .trim();

    if (!command) {
      command = 'Tôi đang ở đây, bạn cần tìm hiểu sự kiện lịch sử nào?';
      this.speak(command);
      this.setState('idle');
      return;
    }

    console.log('🚀 Lệnh giọng nói gửi đi:', command);
    this.onMessage({ role: 'user', text: command });
    this.processUserInput(command);
  }

  speak(text) {
    this.stopSpeaking();

    let cleanSpeech = text
      .replace(/\[ACTION:[^\]]+\]/gi, '')
      .replace(/[*#_~`]/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    // Chuẩn hoá phát âm tiếng Việt: Viết "Loci" nhưng đọc là "lo-xi"
    cleanSpeech = cleanSpeech.replace(/\bloci\b/gi, 'lo-xi');

    if (!cleanSpeech) return;

    // Kiểm tra xem có đang chạy trong kính Meta Quest (Oculus Browser) hoặc không có giọng tiếng Việt hệ thống
    const isQuest = /OculusBrowser|Quest/i.test(navigator.userAgent);
    const viVoices = this.getAvailableVietnameseVoices();
    const useAudioFallback = isQuest || viVoices.length === 0 || !this.synth;

    if (useAudioFallback) {
      console.log('🔊 Sử dụng Audio TTS trực tuyến tiếng Việt cho Meta Quest 2 / Trình duyệt...');
      // Tách văn bản thành các đoạn nhỏ <= 120 ký tự để Google TTS stream ổn định
      const rawSentences = cleanSpeech.match(/[^.!?\n]+[.!?\n]*/g) || [cleanSpeech];
      const chunks = [];
      rawSentences.forEach(s => {
        const trimmed = s.trim();
        if (!trimmed) return;
        if (trimmed.length <= 110) {
          chunks.push(trimmed);
        } else {
          // Tách nhỏ hơn theo dấu phẩy hoặc khoảng trắng
          const words = trimmed.split(' ');
          let cur = '';
          words.forEach(w => {
            if ((cur + ' ' + w).length <= 110) {
              cur = cur ? cur + ' ' + w : w;
            } else {
              if (cur) chunks.push(cur);
              cur = w;
            }
          });
          if (cur) chunks.push(cur);
        }
      });

      this.audioQueue = chunks;
      this.isPlayingAudio = true;
      this.playNextAudioChunk();
      return;
    }

    // Nếu chạy trên Desktop có sẵn giọng tiếng Việt (Google Vi / MS Vi)
    const rawSentences = cleanSpeech.match(/[^.!?]+[.!?]*/g) || [cleanSpeech];
    this.speechQueue = [];
    rawSentences.forEach(s => {
      const trimmed = s.trim();
      if (trimmed.length > 0) this.speechQueue.push(trimmed);
    });

    this.currentSpeechIndex = 0;
    this.speakNextSpeechChunk();
  }

  playNextAudioChunk() {
    if (!this.audioPlayer) return;
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      this.setState('idle');
      if (this.wakeWordListening && !this.isListening && this.recognition) {
        try { this.recognition.start(); } catch (e) {}
      }
      return;
    }

    const chunk = this.audioQueue.shift();
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    this.audioPlayer.src = url;
    this.audioPlayer.playbackRate = this.speechRate || 1.0;
    this.audioPlayer.volume = this.speechVolume || 1.0;

    this.setState('speaking');
    this.audioPlayer.play().catch(e => {
      console.warn('Audio play bị chặn hoặc lỗi, bỏ qua chunk:', e);
      this.playNextAudioChunk();
    });
  }

  speakNextSpeechChunk() {
    if (!this.synth) return;
    if (this.currentSpeechIndex >= this.speechQueue.length) {
      this.setState('idle');
      if (this.wakeWordListening && !this.isListening && this.recognition) {
        try { this.recognition.start(); } catch (e) {}
      }
      return;
    }

    const chunk = this.speechQueue[this.currentSpeechIndex];
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = 'vi-VN';
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = this.speechRate || 0.92;    // Chậm hơn, rõ hơn
    utterance.pitch = this.speechPitch || 0.85;  // Trầm hơn mặc định
    utterance.volume = this.speechVolume || 1.0;

    utterance.onstart = () => {
      this.setState('speaking');
    };
    utterance.onend = () => {
      this.currentSpeechIndex++;
      this.speakNextSpeechChunk();
    };
    utterance.onerror = (e) => {
      console.warn('TTS chunk error:', e);
      // Nếu Web Speech báo lỗi language-unavailable, chuyển sang Audio TTS ngay lập tức
      if (e.error === 'language-unavailable' || e.error === 'not-allowed') {
        console.warn('Chuyển sang Audio TTS trực tuyến do Web Speech không hỗ trợ tiếng Việt.');
        const remaining = this.speechQueue.slice(this.currentSpeechIndex).join('. ');
        this.speechQueue = [];
        this.speak(remaining);
        return;
      }
      this.currentSpeechIndex++;
      this.speakNextSpeechChunk();
    };

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    this.speechQueue = [];
    this.audioQueue = [];
    this.isPlayingAudio = false;

    if (this.audioPlayer) {
      try {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
      } catch (e) {}
    }

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }

    this.setState('idle');
    if (this.wakeWordListening && !this.isListening && this.recognition) {
      try { this.recognition.start(); } catch (e) {}
    }
  }

  /* --- NHẬN DIỆN Ý ĐỊNH ĐIỀU HƯỚNG 3D TRỰC TIẾP --- */
  matchLocusIntent(input, lociList = []) {
    const lower = input.toLowerCase();

    // 1. Điện Biên Phủ
    if (lower.includes('điện biên phủ') || lower.includes('dien bien phu') || lower.includes('bàn trà') || lower.includes('nava') || lower.includes('de castries') || lower.includes('1954')) {
      const l = lociList.find(x => x.id === 'dien_bien_phu');
      if (l) return l;
    }
    // 2. Cách mạng Tháng Tám
    if (lower.includes('tháng tám') || lower.includes('thang tam') || lower.includes('1945') || lower.includes('cửa chính') || lower.includes('cửa ra vào') || lower.includes('tổng khởi nghĩa')) {
      const l = lociList.find(x => x.id === 'cach_mang_thang_tam');
      if (l) return l;
    }
    // 3. Chiến dịch Hồ Chí Minh
    if (lower.includes('hồ chí minh') || lower.includes('ho chi minh') || lower.includes('1975') || lower.includes('30/4') || lower.includes('giải phóng') || lower.includes('tv') || lower.includes('tivi') || lower.includes('dinh độc lập')) {
      const l = lociList.find(x => x.id === 'chien_dich_ho_chi_minh');
      if (l) return l;
    }
    // 4. Hiệp định Giơ-ne-vơ
    if (lower.includes('giơ-ne-vơ') || lower.includes('giơ ne vơ') || lower.includes('geneve') || lower.includes('kệ sách') || lower.includes('bàn làm việc') || lower.includes('vĩ tuyến 17')) {
      const l = lociList.find(x => x.id === 'hiep_dinh_geneve');
      if (l) return l;
    }
    // 5. Phong trào Đồng Khởi
    if (lower.includes('đồng khởi') || lower.includes('dong khoi') || lower.includes('1960') || lower.includes('bến tre') || lower.includes('cửa sổ')) {
      const l = lociList.find(x => x.id === 'dong_khoi');
      if (l) return l;
    }

    // 6. Kiểm tra theo tên của bất kỳ mốc tự tạo nào
    for (const l of lociList) {
      if (lower.includes(l.name.toLowerCase()) || lower.includes(l.locName.toLowerCase())) {
        return l;
      }
    }

    return null;
  }

  /* --- NHẬN DIỆN Ý ĐỊNH RỜI ĐI / TẮT TRỢ LÝ (DISMISS) --- */
  matchDismissIntent(input) {
    if (!input) return false;
    const lower = input.toLowerCase().trim();
    const patterns = [
      /\b(rời đi|roi di|rời khỏi|roi khoi|đi đi|di di|lui đi|lui ra)\b/i,
      /\b(tắt đi|tat di|tắt trợ lý|tat tro ly|tắt ai|tat ai|tắt giúp|tắt giùm|tắt nhé|tắt nha|tắt nó đi)\b/i,
      /\b(đóng lại|dong lai|đóng đi|dong di|đóng trợ lý|dong tro ly|đóng chat|dong chat|đóng cửa sổ|dong cua so)\b/i,
      /\b(ẩn đi|an di|ẩn trợ lý|tạm ẩn|tạm biệt|tam biet|chào tạm biệt|bye|bye bye|goodbye)\b/i,
      /\b(thôi nghỉ đi|thoi nghi di|nghỉ đi|nghi di|thôi nhé|thoi nhe|thôi nha|thoi nha|dừng lại|dung lai|dừng trò chuyện|thoát ra|thoat ra)\b/i,
      /^(oke|ok|okie|okay)\s+bạn(\s+(nhé|nha|ạ|nhé bạn))?$/i,
      /\b(oke bạn|ok bạn|okie bạn)\s+(tắt|đóng|rời|nghỉ|ẩn|dừng)\b/i
    ];
    return patterns.some(p => p.test(lower));
  }

  /* --- XÂY DỰNG PROMPT NẠP TRI THỨC LỊCH SỬ 12 & TIẾN TRÌNH --- */
  buildSystemInstruction(context, userInput = '') {
    const lociList = context.lociList || [];
    const total = lociList.length;
    const mastered = lociList.filter(l => l.status === 'mastered');
    const reviewing = lociList.filter(l => l.status === 'reviewing');
    const unlearned = lociList.filter(l => l.status === 'unlearned');

    const lociSummary = lociList.map(l => {
      let stt = 'Chưa học';
      if (l.status === 'mastered') stt = 'Đã thuộc sâu';
      if (l.status === 'reviewing') stt = 'Đang ôn tập';
      return `- ID "${l.id}": "${l.name}" (${l.year}) tại vị trí "${l.locName}". Trạng thái: [${stt}]. Mẹo nhớ: "${l.mnemonic}".`;
    }).join('\n');

    const progressMemoryPrompt = this.progressManager 
      ? this.progressManager.formatProfileForPrompt(lociList) 
      : '';

    // Nạp tri thức bổ trợ (CHỈ nạp trích dẫn liên quan trực tiếp, TUYỆT ĐỐI KHÔNG nạp mục lục toàn bộ SGK)
    let docxKnowledge = '';
    if (typeof window !== 'undefined' && window.getRelevantHistoricalKnowledge) {
      docxKnowledge = window.getRelevantHistoricalKnowledge(userInput) || '';
    }

    const isSummaryReq = /(tóm tắt|tom tat|notebooklm|đề cương|tổng hợp văn bản|tóm lược|bản đồ kiến thức|historical knowledge map)/i.test(userInput);
    let summaryDirective = '';
    if (isSummaryReq) {
      summaryDirective = `
=== ĐẶC BIỆT KHI XỬ LÝ VĂN BẢN / TÀI LIỆU LỊCH SỬ (HISTORICAL KNOWLEDGE MAP) ===
Khi người dùng đưa vào đoạn văn bản, tài liệu (kể cả ngoài chương trình):
- BẮT BUỘC: Đóng vai trò là "AI chuyên xử lý và chuyển đổi kiến thức lịch sử thành Bản đồ Kiến thức Lịch sử (Historical Knowledge Map)".
- Mục tiêu: Giữ đúng kiến thức, không bịa dữ kiện. Phân biệt rõ dữ kiện có trong nguồn với phần AI đề xuất để ghi nhớ.
- Tuân thủ cấu trúc 3 tầng: TẦNG 1 — FACT • TẦNG 2 — RELATION • TẦNG 3 — MEMORY.
- Định dạng xuất bản chuẩn xác gồm 12 mục:
  # HISTORICAL KNOWLEDGE MAP
  ## 1. Tổng quan
  ## 2. Loại kiến thức
  ## 3. Kiến thức cốt lõi
  ## 4. Timeline
  ## 5. Nhân vật / Đối tượng
  ## 6. Địa điểm
  ## 7. Nguyên nhân → Diễn biến → Kết quả
  ## 8. Knowledge Graph (sơ đồ khối ASCII)
  ## 9. Memory Anchors (phân biệt rõ [FACT] và [MEMORY ANCHOR])
  ## 10. Dữ liệu không gian 3D (Scene, Location, Characters, Objects, Actions, [ACTION:teleport:<id>])
  ## 11. Kiến thức cần nhớ
  ## 12. Kiểm tra ghi nhớ (Flashcards: Hỏi / Đáp)
`;
    }

    return `
Bạn là "Loci" (phát âm tiếng Việt: "lo-xi") — Người bạn đồng hành thông thái, tâm lý và là BẬC THẦY CUNG ĐIỆN KÝ ỨC (Method of Loci) dành riêng cho học sinh ôn thi tốt nghiệp THPT môn Lịch Sử 12.

🚨 QUY TẮC CỐT TỬ CỦA LOCI (BẮT BUỘC TUÂN THỦ 100%):
1. TUYỆT ĐỐI KHÔNG LIỆT KÊ DANH SÁCH BÀI HỌC: Không bao giờ đọc mục lục, không liệt kê "Chúng ta có Bài 1, Bài 2, Bài 3...", trừ khi người dùng hỏi đích danh: "Hãy liệt kê các bài học trong SGK".
2. TRẢ LỜI ĐÚNG TRỌNG TÂM CÂU HỎI: Người dùng hỏi gì thì trả lời thẳng vào vấn đề đó ngay câu đầu tiên. Phân tích nguyên nhân - diễn biến - ý nghĩa - bài học lịch sử sắc bén, mạch lạc.
3. QUAN TÂM CẢM XÚC, THẤU HIỂU & CHÂN THÀNH:
   - Khi học sinh than mệt mỏi, áp lực, lo lắng thi cử: Hãy là người bạn lắng nghe, xoa dịu tâm lý, khuyên bạn hít thở sâu, thư giãn trong căn phòng 3D thanh bình, và truyền cảm hứng tự tin.
   - Xưng hô "mình" - "bạn" ấm áp, gần gũi.
4. BẬC THẦY CUNG ĐIỆN KÝ ỨC (METHOD OF LOCI):
   - Hướng dẫn học sinh gắn mốc lịch sử vào 5 đồ vật trực quan trong phòng Loft 3D:
     + 🏔️ Điện Biên Phủ (1954): Gắn tại BÀN TRÀ TRUNG TÂM (lòng chảo Mường Thanh).
     + 🚩 CMT8 (1945): Gắn tại CỬA CHÍNH RA VÀO (mở toang kỷ nguyên độc lập).
     + 📜 Hiệp định Giơ-ne-vơ (1954): Gắn tại KỆ SÁCH LỚN (văn bản sách vở pháp lý).
     + 🌴 Phong trào Đồng Khởi (1960): Gắn tại CỬA SỔ KÍNH (ngọn gió cách mạng lan tỏa).
     + 🎖️ Chiến dịch Hồ Chí Minh (1975): Gắn tại MÀN HÌNH TIVI (bản tin 30/4 toàn thắng).
   - Chỉ chèn tag [ACTION:TELEPORT:<id_mốc>] khi cần đưa học sinh tới vị trí cụ thể đó.

=== HỒ SƠ TIẾN TRÌNH & GHI NHỚ CỦA HỌC SINH HIỆN TẠI ===
${progressMemoryPrompt}

=== DANH SÁCH MỐC KÝ ỨC TRONG CUNG ĐIỆN ===
${lociSummary || 'Chưa có mốc nào.'}

${docxKnowledge ? `=== TRI THỨC BỔ TRỢ TỪ SGK LỊCH SỬ 12 ===\n${docxKnowledge}\n` : ''}

${summaryDirective}

=== CÁC TAG LỆNH ĐIỀU KHIỂN 3D (CHÈN TỰ NHIÊN KHI CẦN) ===
- [ACTION:TELEPORT:<id_mốc>] : Bay camera tới mốc
- [ACTION:QUIZ_START] : Bật giao diện khảo thí không gian 3D
- [ACTION:PROGRESS_OPEN] : Mở bảng báo cáo tiến trình học tập
- [ACTION:DISMISS] : Tự động trượt đóng trợ lý khi học sinh chào tạm biệt / nhờ tắt
- [ACTION:STATUS:<id_mốc>:mastered] : Đánh dấu mốc đã thuộc sâu
- [ACTION:STATUS:<id_mốc>:reviewing] : Đánh dấu mốc cần ôn lại
`;
  }

  /* --- BỘ SINH CÂU HỎI KHẢO THÍ KIẾN THỨC KHÔNG GIAN (SPATIAL QUIZ ENGINE) --- */
  generateSpatialQuestion(lociList = null, targetLocusId = null) {
    const list = lociList || this.getContext().lociList || [];
    if (!list || list.length === 0) return null;

    // Ưu tiên chọn mốc yếu hoặc chỉ định mốc cụ thể
    let target = null;
    if (targetLocusId) {
      target = list.find(l => l.id === targetLocusId);
    }
    if (!target) {
      const weak = this.progressManager.getWeakLoci(list);
      if (weak.length > 0 && Math.random() < 0.7) {
        target = weak[Math.floor(Math.random() * weak.length)];
      } else {
        target = list[Math.floor(Math.random() * list.length)];
      }
    }

    // 2 Dạng câu hỏi không gian cốt lõi của Loci:
    // 1. loc_to_event: Từ vị trí đồ vật trong phòng -> Hỏi sự kiện lịch sử neo giữ tại đó
    // 2. event_to_loc: Từ sự kiện lịch sử -> Hỏi được đặt tại đồ vật nào trong phòng
    const type = Math.random() < 0.5 ? 'loc_to_event' : 'event_to_loc';

    const otherLoci = list.filter(l => l.id !== target.id);
    const shuffledOthers = [...otherLoci].sort(() => 0.5 - Math.random());
    const distractors = shuffledOthers.slice(0, 3);

    let question = '';
    let correctAnswer = '';
    let options = [];

    if (type === 'loc_to_event') {
      question = `Tại vị trí "${target.locName}" trong phòng, bạn đã neo giữ mốc sự kiện lịch sử nào?`;
      correctAnswer = `${target.name} (${target.year})`;
      options = [
        { text: correctAnswer, isCorrect: true, locusId: target.id },
        ...distractors.map(d => ({ text: `${d.name} (${d.year})`, isCorrect: false, locusId: d.id }))
      ];
    } else {
      question = `Sự kiện "${target.name}" (${target.year}) được đặt tại đồ vật/vị trí nào trong Cung điện Ký ức?`;
      correctAnswer = `${target.locName}`;
      options = [
        { text: correctAnswer, isCorrect: true, locusId: target.id },
        ...distractors.map(d => ({ text: `${d.locName}`, isCorrect: false, locusId: d.id }))
      ];
    }

    // Bổ sung đáp án nhiễu nếu danh sách mốc trong phòng ít hơn 4
    const defaultFurnitureDistractors = [
      'Bàn làm việc cạnh cửa sổ', 'Tủ sách lớn góc phòng', 
      'Bức tranh trên tường phía đông', 'Đèn chùm phòng khách', 
      'Thảm trải sàn trung tâm', 'Ghế bành bọc da'
    ];
    const defaultEventDistractors = [
      'Phong trào Xô Viết Nghệ Tĩnh (1930)', 'Chiến dịch Biên giới Thu Đông (1950)', 
      'Hội nghị Ban Chấp hành TW Đảng VIII (1941)', 'Hiệp định Paris về Việt Nam (1973)'
    ];

    while (options.length < 4) {
      if (type === 'loc_to_event') {
        const dummy = defaultEventDistractors[options.length % defaultEventDistractors.length];
        options.push({ text: dummy, isCorrect: false, locusId: null });
      } else {
        const dummy = defaultFurnitureDistractors[options.length % defaultFurnitureDistractors.length];
        options.push({ text: dummy, isCorrect: false, locusId: null });
      }
    }

    // Xáo trộn 4 đáp án và gán nhãn A, B, C, D
    const letters = ['A', 'B', 'C', 'D'];
    options = options.sort(() => 0.5 - Math.random()).map((opt, idx) => ({
      label: letters[idx],
      text: opt.text,
      isCorrect: opt.isCorrect,
      locusId: opt.locusId
    }));

    return {
      type,
      targetLocus: target,
      question,
      options,
      correctLabel: options.find(o => o.isCorrect).label,
      correctText: correctAnswer,
      explanation: `Mốc "${target.name}" (${target.year}) neo tại "${target.locName}". Mẹo liên tưởng Loci: "${target.mnemonic}".`
    };
  }

  /* --- GHI NHẬN KẾT QUẢ VÀO HỒ SƠ TIẾN TRÌNH --- */
  recordQuizResult(locusId, isCorrect, details = {}) {
    return this.progressManager.recordAnswer(locusId, isCorrect, details);
  }

  getLearningProfile(lociList = null) {
    const list = lociList || this.getContext().lociList || [];
    return this.progressManager.getStatsSummary(list);
  }

  resetLearningProgress() {
    this.progressManager.resetProgress();
  }

  /* --- XỬ LÝ ĐẦU VÀO TỪ NGƯỜI DÙNG --- */
  async askAI(userInput, context = null) {
    return this.processUserInput(userInput, context);
  }

  async processUserInput(userInput, context = null) {
    if (!userInput.trim()) return;

    if (!context || !context.lociList) {
      context = this.getContext();
    }
    const lociList = context.lociList || [];

    // 0. Kiểm tra ngay lập tức yêu cầu rời đi / tắt trợ lý / nói "oke bạn"
    if (this.matchDismissIntent(userInput)) {
      const dismissReplies = [
        'Oke bạn! Tôi xin phép tạm ẩn đi nhé. Khi nào cần bạn cứ gọi Loci nhé!',
        'Oke bạn! Tôi đóng lại đây, khi nào cần ôn bài bạn cứ gọi Loci nha!',
        'Oke bạn! Tạm biệt bạn nhé, chúc bạn học tập thật tốt!'
      ];
      const reply = dismissReplies[Math.floor(Math.random() * dismissReplies.length)];
      this.setState('idle');
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      this.onAction({ type: 'dismiss' });
      return;
    }

    this.setState('thinking');

    // 1. Kiểm tra ý định điều hướng: CHỈ bay khi người dùng THỰC SỰ ra lệnh di chuyển
    // TUYỆT ĐỐI KHÔNG tự động teleport nếu người dùng đang hỏi bài, hỏi ý nghĩa, hỏi cảm xúc, hỏi mẹo nhớ!
    const isQuestion = /(?:là gì|tại sao|như thế nào|thế nào|ý nghĩa|diễn biến|nguyên nhân|kết quả|bài học|phân tích|giải thích|hướng dẫn|so sánh|đối chiếu|khi nào|bao giờ|ở đâu|ai là|ai lãnh đạo|có phải|mệt|áp lực|lo lắng|cung điện ký ức|phương pháp|làm sao|cách nhớ|khảo bài|kiểm tra|\?)/i.test(userInput);

    const isExplicitTeleportCmd = /(?:đưa|dẫn|chở|cho)\s+(?:tôi|mình|em|người\s+dùng)?\s*(?:đi|tới|đến|qua|lại)\s+/i.test(userInput) ||
                                  /\b(?:bay\s+tới|bay\s+đến|di\s+chuyển\s+đến|dẫn\s+đến|chuyển\s+đến|mở\s+mốc|xem\s+mốc)\b/i.test(userInput);

    const matchedLocus = this.matchLocusIntent(userInput, lociList);

    if (matchedLocus && isExplicitTeleportCmd && !isQuestion) {
      console.log('📍 Phát hiện yêu cầu điều hướng rõ ràng tới:', matchedLocus.name);
      this.onAction({ type: 'teleport', locus: matchedLocus });
    }

    // 2. Nếu chưa có API Key, chạy chế độ Phản hồi Offline chuẩn xác
    if (!this.apiKey) {
      setTimeout(() => {
        this.fallbackOfflineResponse(userInput, context, isExplicitTeleportCmd && !isQuestion ? matchedLocus : null);
      }, 300);
      return;
    }

    const systemInstruction = this.buildSystemInstruction(context, userInput);
    let aiReply = null;
    let successfulModel = this.modelName;

    // 3. Kết nối LLM linh hoạt (Hỗ trợ cả OpenRouter và Google Direct API)
    const isOpenRouter = this.apiKey.startsWith('sk-');

    if (isOpenRouter) {
      console.log('🌐 Gọi LLM qua OpenRouter với model 3 flash...');
      const openRouterModels = [
        this.modelName.includes('/') ? this.modelName : 'google/gemini-3.5-flash-lite',
        'google/gemini-3.5-flash-lite',
        'google/gemini-3.7-flash',
        'google/gemini-3.8-flash',
        'google/gemini-2.5-flash'
      ].filter((v, i, a) => a.indexOf(v) === i);

      const messages = [
        { role: 'system', content: systemInstruction }
      ];
      this.chatHistory.slice(-4).forEach(h => {
        const text = h.parts?.[0]?.text || '';
        if (text) {
          messages.push({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: text
          });
        }
      });
      messages.push({ role: 'user', content: userInput });

      for (const model of openRouterModels) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
              'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://localhost',
              'X-Title': 'Loci History 12'
            },
            body: JSON.stringify({
              model: model,
              max_tokens: 1500,
              temperature: 0.65,
              messages: messages
            })
          });

          if (response.ok) {
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content;
            if (text && text.trim()) {
              aiReply = text.trim();
              successfulModel = model;
              console.log('✅ OpenRouter phản hồi thành công từ model:', model);
              break;
            }
          } else {
            console.warn(`OpenRouter model ${model} trả về lỗi ${response.status}`);
          }
        } catch (e) {
          console.warn(`Lỗi khi gọi OpenRouter model ${model}:`, e);
        }
      }
    } else {
      // Direct Google Gemini API
      console.log('🌐 Gọi Google Gemini Direct API...');
      const googleModels = [
        this.modelName.replace('google/', ''),
        'gemini-3.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
      ].filter((v, i, a) => a.indexOf(v) === i);

      for (const model of googleModels) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
          const requestBody = {
            contents: [
              ...this.chatHistory.slice(-4),
              { role: 'user', parts: [{ text: userInput }] }
            ],
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            generationConfig: {
              temperature: 0.65,
              maxOutputTokens: 2500
            }
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            const successResponse = await response.json();
            const text = successResponse.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) {
              aiReply = text.trim();
              successfulModel = model;
              console.log('✅ Google API phản hồi thành công từ model:', model);
              break;
            }
          }
        } catch (e) {
          console.warn(`Lỗi khi gọi Google Direct model ${model}:`, e);
        }
      }
    }

    if (aiReply) {
      this.modelName = successfulModel;
      localStorage.setItem('loci_gemini_model', successfulModel);

      aiReply = aiReply
        .replace(/(?:^|\n)\*?\*?(?:Thinking Process|Analysis|Thought|Drafting content|Decoding|User Query):[\s\S]*?(?=\n\n|\n[#\*\d]|\n[A-ZÀ-Ỹ]|$)/gi, '')
        .replace(/^\s*\([A-Za-z\s0-9—\-,'"]+\)\s*\.?/gm, '')
        .trim();

      this.chatHistory.push({ role: 'user', parts: [{ text: userInput }] });
      this.chatHistory.push({ role: 'model', parts: [{ text: aiReply }] });

      // Trích xuất tag hành động nếu Gemini chèn
      this.extractAndExecuteAction(aiReply, context);

      this.onMessage({ role: 'assistant', text: aiReply });
      this.speak(aiReply);
    } else {
      console.warn('Tất cả các model Gemini/OpenRouter đều không khả dụng, chuyển sang chế độ Offline.');
      this.fallbackOfflineResponse(userInput, context, isExplicitTeleportCmd && !isQuestion ? matchedLocus : null);
    }
  }

  /* --- TRÍCH XUẤT LỆNH HÀNH ĐỘNG TỪ GEMINI --- */
  extractAndExecuteAction(aiReply, context) {
    const lociList = context.lociList || this.getContext().lociList || [];

    // 1. Bay đến mốc 3D
    const teleportMatch = aiReply.match(/\[ACTION:TELEPORT:([a-zA-Z0-9_-]+)\]/i);
    if (teleportMatch) {
      const targetId = teleportMatch[1].toLowerCase();
      const targetLocus = lociList.find(l => l.id.toLowerCase() === targetId);
      if (targetLocus) {
        this.onAction({ type: 'teleport', locus: targetLocus });
      }
    }

    // 2. Kích hoạt bài khảo thí không gian
    if (/\[ACTION:QUIZ_START\]/i.test(aiReply)) {
      this.onAction({ type: 'quiz_start' });
    }

    // 3. Mở bảng tiến trình học tập
    if (/\[ACTION:PROGRESS_OPEN\]/i.test(aiReply)) {
      this.onAction({ type: 'progress_open' });
    }

    // 4. Cập nhật trạng thái mốc ký ức
    const statusMatch = aiReply.match(/\[ACTION:STATUS:([a-zA-Z0-9_-]+):(mastered|reviewing|unlearned)\]/i);
    if (statusMatch) {
      const locusId = statusMatch[1];
      const newStatus = statusMatch[2].toLowerCase();
      this.onAction({ type: 'update_status', locusId, status: newStatus });
    }

    // 5. Yêu cầu rời đi / tắt trợ lý
    if (/\[ACTION:DISMISS\]/i.test(aiReply)) {
      this.onAction({ type: 'dismiss' });
    }
  }

  /* --- ĐỘNG CƠ TRI THỨC SGK LỊCH SỬ 12 & TÂM LÝ THÔNG MINH (OFFLINE RAG & FALLBACK) --- */
  fallbackOfflineResponse(input, context, directLocus = null) {
    const q = input.toLowerCase().trim();
    const lociList = context.lociList || this.getContext().lociList || [];

    // 1. Yêu cầu rời đi / tắt trợ lý
    if (this.matchDismissIntent(input)) {
      const reply = 'Oke bạn nhé! Mình tạm ẩn đi đây, khi nào cần học bài hay tâm sự bạn cứ gọi "Hey Loci" là mình xuất hiện ngay! [ACTION:DISMISS]';
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      this.onAction({ type: 'dismiss' });
      return;
    }

    // 1.5. Yêu cầu tóm tắt tài liệu / đoạn văn chuẩn NotebookLM
    if (q.includes('tóm tắt') || q.includes('tom tat') || q.includes('notebooklm') || q.includes('đề cương') || q.includes('tóm lược')) {
      let rawSource = input.replace(/^(?:hãy\s+)?(?:tóm tắt|tom tat|notebooklm|lập đề cương|tóm lược)(?:\s+giúp\s+(?:tôi|mình))?(?:\s+(?:đoạn văn|bài|tài liệu|văn bản)(?:\s+này)?)?[:\-\s]*/i, '').trim();
      if (!rawSource || rawSource.length < 15) {
        rawSource = input;
      }

      let summaryReply = "";
      if (typeof window !== 'undefined' && typeof window.generateUniversalOfflineSummary === 'function') {
        summaryReply = window.generateUniversalOfflineSummary(rawSource, 'all');
      } else {
        summaryReply = this.generateUniversalOfflineSummaryInternal(rawSource, 'all');
      }

      this.onMessage({ role: 'assistant', text: summaryReply });
      this.speak(`Đã hoàn tất bản tóm tắt chuẩn NotebookLM từ tài liệu nguồn bạn cung cấp. Mời bạn xem chi tiết trên bảng nhé!`);
      this.extractAndExecuteAction(summaryReply, context);
      return;
    }

    // 2. Yêu cầu khảo bài / trắc nghiệm không gian
    if (q.includes('kiểm tra') || q.includes('khảo bài') || q.includes('đố tôi') || q.includes('bài thi') || q.includes('trắc nghiệm')) {
      const quiz = this.generateSpatialQuestion(lociList);
      if (quiz) {
        const reply = `🧠 [KHẢO THÍ KHÔNG GIAN LOCI]\n${quiz.question}\n\n` +
          quiz.options.map(o => `${o.label || '•'}. ${o.text}`).join('\n') +
          `\n\n(Bạn hãy chọn đáp án hoặc bấm nút bắt đầu thi 3D nhé!) [ACTION:QUIZ_START] [ACTION:TELEPORT:${quiz.targetLocus.id}]`;
        this.onMessage({ role: 'assistant', text: reply });
        this.speak(`Câu hỏi khảo bài: ${quiz.question}`);
        this.onAction({ type: 'quiz_start', questionData: quiz });
        return;
      }
    }

    // 3. Yêu cầu xem tiến trình học tập
    if (q.includes('tiến trình') || q.includes('báo cáo') || q.includes('điểm yếu') || q.includes('kỷ lục') || q.includes('streak') || q.includes('bao nhiêu câu')) {
      const summary = this.progressManager.getStatsSummary(lociList);
      const reply = `📊 TIẾN TRÌNH HỌC TẬP KHÔNG GIAN CỦA BẠN:\n` +
        `• Đã làm: ${summary.totalAnswered} câu (Đúng ${summary.correctCount} - Đạt ${summary.accuracy}%)\n` +
        `• Chuỗi đúng hiện tại: ${summary.currentStreak} 🔥 (Kỷ lục: ${summary.bestStreak} 🏆)\n` +
        `• Mốc thuộc sâu: ${summary.masteredCount}/${summary.totalLoci} mốc.\n` +
        `Mình đang mở bảng tiến trình học tập chi tiết cho bạn xem nhé! [ACTION:PROGRESS_OPEN]`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      this.onAction({ type: 'progress_open' });
      return;
    }

    // 4. QUAN TÂM CẢM XÚC & GIẢI TỎA ÁP LỰC (EMPATHY & STRESS RELIEF)
    const isEmotional = /(mệt|áp lực|lo lắng|lo quá|sợ|chán|nản|stress|không nhớ được|quên hết|học không vô|sợ rớt|sợ điểm kém|cố lên|động viên|buồn|nặng đầu)/i.test(q);
    if (isEmotional) {
      const reply = `Mình hiểu mà! Giai đoạn ôn thi tốt nghiệp THPT môn Lịch Sử với cả trăm mốc sự kiện thực sự rất dễ khiến bạn quá tải và lo lắng. Nhưng bạn đừng tự trách mình nhé: não bộ con người vốn không sinh ra để "học vẹt" số liệu khô khan đâu!

🌿 **Lời khuyên nhỏ cho bạn lúc này:**
1. Hãy tạm dừng lại 1-2 phút, hít một hơi thật sâu và phóng tầm mắt ngắm nhìn không gian căn phòng 3D thanh bình này.
2. Đừng cố nhồi nhét cả cuốn sách trong một ngày. Chúng mình sẽ đi dạo qua từng góc phòng và gắn từng sự kiện vào đồ vật thân quen (như Bàn trà, Cửa sổ, Kệ sách...). Nhớ bằng hình ảnh không gian sẽ nhẹ nhàng và sâu sắc hơn rất nhiều!
3. Bạn đã rất nỗ lực rồi. Bất cứ khi nào mệt mỏi hay cần ôn lại mốc nào, mình luôn ở đây đồng hành cùng bạn! Cố lên nhé, bạn nhất định sẽ làm tốt! 💪✨`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 5. GIẢI THÍCH PHƯƠNG PHÁP CUNG ĐIỆN KÝ ỨC (METHOD OF LOCI)
    const isLociMethod = /(cung điện ký ức|method of loci|phương pháp loci|cách nhớ|mẹo nhớ|làm sao để nhớ|làm sao nhớ lâu|nguyên lý nhớ|tại sao lại nhớ)/i.test(q);
    if (isLociMethod) {
      const reply = `🧠 **BÍ QUYẾT CUNG ĐIỆN KÝ ỨC (METHOD OF LOCI) TRONG PHÒNG 3D:**

Não bộ con người ghi nhớ vị trí không gian và hình ảnh trực quan tốt hơn hàng ngàn lần so với chữ viết. Thay vì học vẹt, bạn hãy gắn 5 mốc lịch sử cốt lõi vào 5 đồ vật cố định trong căn phòng này:

1. 🚩 **Cửa chính ra vào** ➔ **Cách mạng Tháng Tám (1945)**: Cánh cửa mở toang kỷ nguyên độc lập tự do cho dân tộc.
2. 🏔️ **Bàn trà trung tâm** ➔ **Chiến dịch Điện Biên Phủ (1954)**: Mặt bàn trũng phẳng như lòng chảo Mường Thanh "chấn động địa cầu".
3. 📜 **Kệ sách lớn góc phòng** ➔ **Hiệp định Giơ-ne-vơ (1954)**: Nơi lưu giữ các văn bản pháp lý quốc tế công nhận quyền dân tộc cơ bản.
4. 🌴 **Khung cửa sổ kính** ➔ **Phong trào Đồng Khởi (1960)**: Ngọn gió bão táp cách mạng thổi bùng từ Bến Tre ra toàn miền Nam.
5. 🎖️ **Màn hình Tivi lớn** ➔ **Chiến dịch Hồ Chí Minh (1975)**: Bản tin toàn thắng 11h30 trưa ngày 30/4/1975 rực rỡ non sông!

💡 **Cách dùng:** Mỗi khi cần nhớ lại kiến thức, bạn chỉ cần nhắm mắt và "đi dạo" một vòng quanh phòng, hình ảnh sự kiện sẽ tự động ùa về sống động!`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 6. CHỈ KHI NGƯỜI DÙNG THỰC SỰ HỎI DANH SÁCH BÀI HỌC / MỤC LỤC
    const isAskingLessonList = /(danh sách bài|mục lục|bao nhiêu bài|những bài nào trong sgk|các bài học|các chủ đề trong sgk)/i.test(q);
    if (isAskingLessonList) {
      const reply = `📚 **MỤC LỤC 6 CHỦ ĐỀ SGK LỊCH SỬ 12:**
• **Chủ đề 1:** Thế giới trong và sau Chiến tranh Lạnh (Bài 1, 2)
• **Chủ đề 2:** ASEAN: Những chặng đường lịch sử (Bài 3, 4)
• **Chủ đề 3:** Cách mạng Tháng Tám 1945 & Chiến tranh giải phóng dân tộc (1945 - 1975) (Bài 5, 6, 7, 8)
• **Chủ đề 4:** Công cuộc Đổi mới ở Việt Nam từ 1986 đến nay (Bài 9, 10, 11)
• **Chủ đề 5:** Lịch sử đối ngoại Việt Nam thời cận - hiện đại (Bài 12, 13)
• **Chủ đề 6:** Hồ Chí Minh trong lịch sử Việt Nam (Bài 14, 15, 16)

Bạn muốn tìm hiểu sâu về sự kiện nào trong các chủ đề trên? Hãy hỏi trực tiếp để mình phân tích cho bạn nhé!`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 7. ĐIỀU HƯỚNG CỤ THỂ KHI NGƯỜI DÙNG RA LỆNH RÕ RÀNG
    if (directLocus) {
      const reply = `Đang đưa bạn đến mốc "${directLocus.name}" (${directLocus.year}) tại vị trí ${directLocus.locName}! Mẹo nhớ Loci: ${directLocus.mnemonic} [ACTION:TELEPORT:${directLocus.id}]`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      this.onAction({ type: 'teleport', locus: directLocus });
      return;
    }

    // 8. ĐỘNG CƠ PHÂN TÍCH TRI THỨC LỊCH SỬ TRỌNG TÂM (ĐÚNG TRỌNG TÂM CÂU HỎI)
    const isMeaning = q.includes('ý nghĩa') || q.includes('tầm vóc') || q.includes('vai trò');
    const isProgress = q.includes('diễn biến') || q.includes('các đợt') || q.includes('tiến trình') || q.includes('giai đoạn');
    const isCause = q.includes('nguyên nhân') || q.includes('tại sao') || q.includes('bối cảnh') || q.includes('hoàn cảnh') || q.includes('kế hoạch');

    // 8.1. CHIẾN DỊCH ĐIỆN BIÊN PHỦ (1954)
    if (q.includes('điện biên') || (q.includes('1954') && !q.includes('giơ') && !q.includes('genev'))) {
      let reply = '';
      if (isMeaning) {
        reply = `### 🏆 Ý NGHĨA LỊCH SỬ CỦA CHIẾN DỊCH ĐIỆN BIÊN PHỦ (1954)

**1. Đối với dân tộc:**
- Giáng đòn quyết định đập tan hoàn toàn Kế hoạch Nava của Pháp có Mĩ can thiệp.
- Thắng lợi quân sự lớn nhất trong 9 năm kháng chiến chống Pháp (1945 - 1954), bảo vệ vững chắc thành quả CMT8.
- Tạo bước ngoặt ngoại giao quyết định, buộc Pháp ký Hiệp định Giơ-ne-vơ (21/7/1954), công nhận độc lập, chủ quyền, thống nhất, toàn vẹn lãnh thổ và giải phóng miền Bắc.

**2. Đối với thế giới:**
- Là phát pháo hiệu mở đầu cho sự sụp đổ của hệ thống thuộc địa chủ nghĩa thực dân cũ trên thế giới.
- Cổ vũ mạnh mẽ phong trào giải phóng dân tộc ở Á - Phi - Mĩ Latinh.

💡 **Gợi nhớ Loci:** Gắn tại **Bàn trà trung tâm phòng khách** (lòng chảo Mường Thanh). [ACTION:TELEPORT:dien_bien_phu]`;
      } else if (isProgress) {
        reply = `### ⚔️ DIỄN BIẾN 3 ĐỢT TIẾN CÔNG ĐIỆN BIÊN PHỦ (13/3 – 07/5/1954)
- **Đợt 1 (13/3 – 17/3/1954):** Tiêu diệt cứ điểm Him Lam, Độc Lập, bức hàng Bản Kéo, đập tan phân khu Bắc.
- **Đợt 2 (30/3 – 26/4/1954):** Đánh các cứ điểm phía Đông (đồi A1, C1...). Chiến sự ác liệt tại đồi A1. Ta đào hào siết chặt vây ráp sân bay Mường Thanh.
- **Đợt 3 (01/5 – 07/5/1954):** Tổng công kích toàn mặt trận. **17h30 ngày 07/5/1954**, cờ Quyết chiến Quyết thắng tung bay trên nóc hầm De Castries, bắt sống toàn bộ ban chỉ huy địch.

💡 **Gợi nhớ Loci:** Gắn tại **Bàn trà trung tâm phòng khách**. [ACTION:TELEPORT:dien_bien_phu]`;
      } else {
        reply = `### 🏔️ CHIẾN DỊCH ĐIỆN BIÊN PHỦ (13/3/1954 – 07/5/1954)
- **Phương châm tác chiến:** Đại tướng Võ Nguyên Giáp quyết định chuyển từ "Đánh nhanh, thắng nhanh" sang "Đánh chắc, tiến chắc" — quyết định mang tính bước ngoặt lịch sử.
- **Kết quả:** Sau 56 ngày đêm "khoét núi, ngủ hầm, mưa dầm, cơm vắt", ta xóa sổ hoàn toàn tập đoàn cứ điểm mạnh nhất Đông Dương của Pháp.
- **Vị trí liên tưởng Loci:** **Bàn trà trung tâm phòng khách**. [ACTION:TELEPORT:dien_bien_phu]`;
      }
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 8.2. CÁCH MẠNG THÁNG TÁM (1945)
    if (q.includes('tháng tám') || (q.includes('1945') && !q.includes('hồ chí minh'))) {
      let reply = `### 🚩 CÁCH MẠNG THÁNG TÁM NĂM 1945
**1. Thời cơ "ngàn năm có một":**
- Xuất hiện từ khi Nhật đầu hàng Đồng minh (15/8/1945) đến trước khi quân Đồng minh vào Đông Dương (đầu tháng 9/1945).
- 4 tỉnh giành chính quyền sớm nhất cả nước: **Bắc Giang, Hải Dương, Hà Tĩnh, Quảng Nam** (18/8/1945).

**2. Ý nghĩa lịch sử:**
- Phá tan xiềng xích nô lệ thực dân Pháp hơn 80 năm và phát xít Nhật, lật đổ chế độ phong kiến ngàn năm.
- Khai sinh nước Việt Nam Dân chủ Cộng hòa (02/9/1945), đưa nhân dân ta từ thân phận nô lệ thành người làm chủ đất nước.

💡 **Gợi nhớ Loci:** Gắn tại **Cửa chính ra vào phòng khách** (cánh cửa mở toang kỷ nguyên mới). [ACTION:TELEPORT:cach_mang_thang_tam]`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 8.3. CHIẾN DỊCH HỒ CHÍ MINH (1975) & ĐẠI THẮNG MÙA XUÂN
    if (q.includes('hồ chí minh') || q.includes('1975') || q.includes('30/4') || q.includes('giải phóng miền nam')) {
      let reply = `### 🎖️ CHIẾN DỊCH HỒ CHÍ MINH (26/4 – 30/4/1975)
- **Phương châm:** "Thần tốc, táo bạo, bất ngờ, chắc thắng".
- **Thời khắc lịch sử:** Đúng **10h45 ngày 30/4/1975**, xe tăng 390 húc đổ cổng Dinh Độc Lập; **11h30**, cờ giải phóng tung bay trên nóc Dinh Độc Lập, chiến dịch toàn thắng.
- **Ý nghĩa lịch sử:** Kết thúc vẻ vang 21 năm kháng chiến chống Mĩ cứu nước và 30 năm chiến tranh giải phóng dân tộc (1945 - 1975), giải phóng hoàn toàn miền Nam, thống nhất non sông, đưa cả nước đi lên CNXH.

💡 **Gợi nhớ Loci:** Gắn tại **Màn hình Tivi lớn phòng khách** (nơi phát đi bản tin toàn thắng 30/4). [ACTION:TELEPORT:chien_dich_ho_chi_minh]`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 8.4. HIỆP ĐỊNH GIƠ-NE-VƠ (1954)
    if (q.includes('giơ') || q.includes('genev') || q.includes('vĩ tuyến 17')) {
      let reply = `### 📜 HIỆP ĐỊNH GIƠ-NE-VƠ NĂM 1954 VỀ ĐÔNG DƯƠNG
- **Nội dung then chốt:** Pháp và các nước tham dự tôn trọng độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của Việt Nam, Lào, Campuchia.
- **Giới tuyến quân sự tạm thời:** Lấy vĩ tuyến 17 (sông Bến Hải) làm giới tuyến tạm thời để tập kết quân đội; tổng tuyển cử tự do sau 2 năm (tháng 7/1956).
- **Ý nghĩa:** Văn bản pháp lý quốc tế đầu tiên ghi nhận các quyền dân tộc cơ bản của ba nước Đông Dương, giải phóng hoàn toàn miền Bắc.

💡 **Gợi nhớ Loci:** Gắn tại **Kệ sách lớn góc phòng**. [ACTION:TELEPORT:hiep_dinh_geneve]`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 8.5. PHONG TRÀO ĐỒNG KHỞI (1959 - 1960)
    if (q.includes('đồng khởi') || q.includes('1960') || q.includes('bến tre') || q.includes('nghị quyết 15')) {
      let reply = `### 🌴 PHONG TRÀO ĐỒNG KHỞI (1959 - 1960)
- **Bối cảnh:** Nghị quyết Hội nghị TW 15 (1/1959) xác định con đường bạo lực cách mạng để giải phóng miền Nam.
- **Địa bàn bùng nổ:** Ngày 17/1/1960 tại huyện Mỏ Cày (Bến Tre), sau đó lan rộng khắp Nam Bộ, Tây Nguyên và Trung Trung Bộ.
- **Ý nghĩa bước ngoặt:** Chuyển cách mạng miền Nam từ thế *giữ gìn lực lượng* sang thế *tiến công*, làm sụp đổ từng mảng chính quyền địch ở nông thôn, dẫn tới sự ra đời của Mặt trận Dân tộc Giải phóng miền Nam (20/12/1960).

💡 **Gợi nhớ Loci:** Gắn tại **Cửa sổ kính nhìn ra ngoài trời**. [ACTION:TELEPORT:dong_khoi]`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 8.6. SO SÁNH CÁC CHIẾN LƯỢC CHIẾN TRANH CỦA MĨ Ở MIỀN NAM
    if (q.includes('chiến lược') || q.includes('đặc biệt') || q.includes('cục bộ') || q.includes('việt nam hóa') || q.includes('so sánh')) {
      let reply = `### ⚔️ SO SÁNH 3 CHIẾN LƯỢC CHIẾN TRANH CỦA MĨ Ở VIỆT NAM

1. **Chiến tranh Đặc biệt (1961 - 1965):**
   - Lực lượng: Quân đội Sài Gòn (ngụy) là nòng cốt + Cố vấn quân sự và vũ khí Mĩ.
   - Thủ đoạn: "Ấp chiến lược" (quốc sách) + Chiến thuật trực thăng vận, thiết xa vận.
   - Thất bại: Bị phá sản hoàn toàn sau chiến thắng Ấp Bắc (1963), Bình Giã, Ba Gia, Đồng Xoài (1965).

2. **Chiến tranh Cục bộ (1965 - 1968):**
   - Lực lượng: **Quân viễn chinh Mĩ** và quân đồng minh là nòng cốt + Quân đội Sài Gòn.
   - Thủ đoạn: Chiến lược 2 gọng kìm "Tìm diệt" và "Bình định" + Leo thang ném bom phá hoại miền Bắc.
   - Thất bại: Sau đòn mở màn Vạn Tường (1965) và đỉnh cao là Cuộc Tổng tiến công và nổi dậy Xuân Mậu Thân 1968 (buộc Mĩ xuống thang chiến tranh, ngừng ném bom miền Bắc và chấp nhận đàm phán tại Paris).

3. **Việt Nam hóa chiến tranh (1969 - 1973):**
   - Lực lượng: Quân đội Sài Gòn là nòng cốt + Hỏa lực, không quân, hậu cần Mĩ.
   - Thủ đoạn: "Dùng người Việt đánh người Việt", mở rộng chiến tranh ra toàn Đông Dương.
   - Thất bại: Đòn sấm sét Điện Biên Phủ trên không (12/1972) buộc Mĩ ký Hiệp định Paris 1973, rút toàn bộ quân Mĩ về nước ("đánh cho Mĩ cút").`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 8.7. KHÁNG CHIẾN CHỐNG PHÁP (1945 - 1954): VIỆT BẮC 1947 & BIÊN GIỚI 1950
    if (q.includes('việt bắc') || q.includes('biên giới') || q.includes('1947') || q.includes('1950')) {
      let reply = `### 🛡️ CHIẾN DỊCH VIỆT BẮC 1947 & BIÊN GIỚI 1950

• **Chiến dịch Việt Bắc Thu - Đông 1947:**
  - Mục tiêu của Pháp: Đánh úp cơ quan đầu não kháng chiến nhằm "đánh nhanh thắng nhanh".
  - Ý nghĩa: Ta bảo vệ an toàn cơ quan đầu não, chuyển cuộc kháng chiến chống Pháp sang giai đoạn mới, buộc Pháp chuyển từ "đánh nhanh thắng nhanh" sang "đánh lâu dài".

• **Chiến dịch Biên giới Thu - Đông 1950:**
  - Mục tiêu của ta: Khai thông biên giới Việt - Trung, mở rộng căn cứ địa Việt Bắc.
  - Ý nghĩa bước ngoặt: Ta giành quyền chủ động chiến lược trên chiến trường chính Bắc Bộ, phá vỡ thế bao vây của địch đối với căn cứ địa kháng chiến.`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 8.8. TRẬT TỰ HAI CỰC IANTA & LIÊN HỢP QUỐC
    if (q.includes('ianta') || q.includes('liên hợp quốc') || q.includes('lhq') || q.includes('chiến tranh lạnh')) {
      let reply = `### 🌐 TRẬT TỰ HAI CỰC IANTA & LIÊN HỢP QUỐC
- **Hội nghị Ianta (2/1945):** Ba cường quốc Liên Xô, Mĩ, Anh phân chia khu vực ảnh hưởng ở châu Âu và châu Á, hình thành trật tự thế giới hai cực Ianta do Liên Xô và Mĩ đứng đầu.
- **Liên Hợp Quốc (LHQ - 1945):** Mục tiêu duy trì hòa bình và an ninh thế giới, phát triển quan hệ hữu nghị giữa các quốc gia. Nguyên tắc hoạt động cốt lõi là sự nhất trí của 5 nước Ủy viên thường trực Hội đồng Bảo an (Mĩ, Nga, Anh, Pháp, Trung Quốc).`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 8.9. CÔNG CUỘC ĐỔI MỚI (TỪ 1986 ĐẾN NAY)
    if (q.includes('đổi mới') || q.includes('1986') || q.includes('đại hội vi')) {
      let reply = `### 🇻🇳 CÔNG CUỘC ĐỔI MỚI ĐẤT NƯỚC (TỪ 1986)
- **Khởi xướng:** Đại hội Đại biểu toàn quốc lần thứ VI của Đảng (12/1986) đề ra đường lối đổi mới toàn diện, lấy đổi mới kinh tế làm trọng tâm.
- **Chuyển đổi kinh tế:** Chuyển từ cơ chế quản lý tập trung quan liêu bao cấp sang kinh tế thị trường định hướng xã hội chủ nghĩa.
- **Ý nghĩa:** Đưa Việt Nam thoát khỏi khủng hoảng kinh tế - xã hội, nâng cao vị thế quốc tế, đưa đất nước hội nhập sâu rộng toàn cầu.`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 8.10. CHỦ TỊCH HỒ CHÍ MINH
    if (q.includes('bác hồ') || q.includes('nguyễn ái quốc') || q.includes('nguyễn tất thành')) {
      let reply = `### 🌟 CHỦ TỊCH HỒ CHÍ MINH TRONG TIẾN TRÌNH LỊCH SỬ DÂN TỘC
- **05/6/1911:** Người ra đi tìm đường cứu nước từ Bến Nhà Rồng.
- **7/1920:** Đọc Sơ thảo Luận cương của Lênin, tìm thấy con đường cứu nước duy nhất: con đường cách mạng vô sản.
- **1930:** Sáng lập Đảng Cộng sản Việt Nam (03/2/1930) và soạn thảo Cương lĩnh chính trị đầu tiên.
- **1941:** Về nước trực tiếp lãnh đạo cách mạng, thành lập Mặt trận Việt Minh tại Pác Bó (Cao Bằng).
- **02/9/1945:** Đọc Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hòa.`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // 8.11. CHÀO HỎI / DANH TÍNH BAN ĐẦU
    if (q.includes('chào') || q.includes('hello') || q.includes('hi') || q.includes('bạn là ai') || q.includes('giới thiệu')) {
      const reply = `Xin chào bạn! Mình là **Loci** — Trợ lý AI đồng hành ôn thi THPT môn Lịch Sử 12 bằng phương pháp Cung điện Ký ức 3D. 

Mình có thể giúp bạn:
1. Giải đáp cặn kẽ ý nghĩa, diễn biến và bài học lịch sử của các sự kiện 12.
2. Hướng dẫn mẹo liên tưởng không gian vào các đồ vật trong phòng để nhớ lâu không quên.
3. Khảo bài trắc nghiệm nhanh hoặc lắng nghe tâm sự, giải tỏa áp lực thi cử cùng bạn.

Bạn đang quan tâm đến sự kiện nào hoặc muốn mình hỗ trợ điều gì cứ nói với mình nhé! 😊`;
      this.onMessage({ role: 'assistant', text: reply });
      this.speak(reply);
      return;
    }

    // MẶC ĐỊNH: Phản hồi thông minh (khi API mất kết nối)
    let kbDocs = '';
    if (typeof window !== 'undefined' && window.getRelevantHistoricalKnowledge) {
      kbDocs = window.getRelevantHistoricalKnowledge(q);
    }
    
    let reply = `[Hệ thống] Trí tuệ nhân tạo Gemini đang tạm mất kết nối. Dù vậy, mình đã nghe rõ câu hỏi của bạn.\n\n`;
    if (kbDocs && kbDocs.length > 20) {
      reply += `Dựa vào CSDL Lịch Sử 12, mình tìm thấy dữ liệu:\n${kbDocs.substring(0, 350)}...\n\n`;
      reply += `(Vui lòng kiểm tra lại kết nối mạng hoặc API Key để trải nghiệm Loci AI đầy đủ nhất!)`;
    } else {
      reply += `Để giúp bạn nắm chắc kiến thức, bạn có thể hỏi mình cụ thể hơn về:
• **Ý nghĩa hoặc Diễn biến** của Chiến dịch Điện Biên Phủ 1954, CMT8 1945...
• **Mẹo liên tưởng Cung điện Ký ức** gắn vào đồ vật trong căn phòng 3D này.
• Hoặc nói *"Khảo bài tôi đi"* để mình đố bạn vài câu trắc nghiệm nhé!
(Kiểm tra lại kết nối API để trò chuyện sâu hơn cùng mình)`;
    }

    this.onMessage({ role: 'assistant', text: reply });
    this.speak(reply);
  }

  /* --- HÀM TÓM TẮT DYNAMIC NLP DỰ PHÒNG CHO MỌI VĂN BẢN (KỂ CẢ NGOÀI CHƯƠNG TRÌNH) --- */
  generateUniversalOfflineSummaryInternal(sourceText, format = 'all') {
    if (!sourceText || !sourceText.trim()) return '';

    function distillText(str, maxWords = 16) {
      if (!str) return '';
      let clean = str.replace(/^(?:theo\s+đó|như\s+vậy|có\s+thể\s+thấy|chúng\s+ta\s+thấy|được\s+biết\s+đến\s+như\s+là|nói\s+cách\s+khác|ngoài\s+ra|mặt\s+khác|bên\s+cạnh\s+đó|cụ\s+thể\s+là)[,:\s]*/i, '').trim();
      const words = clean.split(/\s+/);
      if (words.length <= maxWords) return clean;
      return words.slice(0, maxWords).join(' ') + '...';
    }

    function extractTag(str) {
      if (!str) return 'Trọng tâm';
      const pMatch = str.match(/[\("“]([^"”\)]+)[\)"”]/);
      if (pMatch && pMatch[1].length <= 25) return pMatch[1].trim();
      const capMatch = str.match(/[A-ZÀ-Ỹ][\w\d\s\-]{2,22}/);
      if (capMatch) return capMatch[0].trim();
      return str.split(/\s+/).slice(0, 3).join(' ');
    }

    const rawLines = sourceText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const cleanText = sourceText.replace(/[#*`_>|]/g, ' ').replace(/\s+/g, ' ').trim();
    const lower = sourceText.toLowerCase();

    // 1. Tiêu đề
    let title = "BẢN ĐỒ KIẾN THỨC LỊCH SỬ";
    if (rawLines.length > 0 && rawLines[0].length <= 80 && !rawLines[0].endsWith('.')) {
      title = rawLines[0].toUpperCase().replace(/^[-*•\d\.\s#]+/, '').trim();
    } else {
      const words = cleanText.split(/\s+/);
      title = words.slice(0, 7).join(' ').toUpperCase() + '...';
    }

    // 2. Nhận diện mốc Lịch Sử 12 nếu có (3D Teleport)
    let actionTag = "";
    let locusKey = "";
    if (lower.includes('điện biên')) { actionTag = "[ACTION:teleport:dien_bien_phu]"; locusKey = "Điện Biên Phủ"; }
    else if (lower.includes('tháng tám')) { actionTag = "[ACTION:teleport:cach_mang_thang_tam]"; locusKey = "Cách mạng tháng Tám 1945"; }
    else if (lower.includes('đồng khởi')) { actionTag = "[ACTION:teleport:dong_khoi]"; locusKey = "Phong trào Đồng khởi 1959 - 1960"; }
    else if (lower.includes('hồ chí minh') || lower.includes('30/4')) { actionTag = "[ACTION:teleport:chien_dich_ho_chi_minh]"; locusKey = "Chiến dịch Hồ Chí Minh 1975"; }
    else if (lower.includes('giơ-ne-vơ') || lower.includes('geneve')) { actionTag = "[ACTION:teleport:hiep_dinh_geneve]"; locusKey = "Hiệp định Giơ-ne-vơ 1954"; }

    // 3. Tự nhận diện Loại kiến thức (Rule 2)
    const detectedTypes = [];
    if (/chiến dịch|trận đánh|tiến công|tập đoàn cứ điểm|chiến trường|nava|quân sự|pháo binh/i.test(sourceText)) detectedTypes.push("Chiến tranh / trận đánh");
    if (/cách mạng|khởi nghĩa|phong trào|đấu tranh chính trị|tổng tuyển cử/i.test(sourceText)) detectedTypes.push("Phong trào / cách mạng");
    if (/triều đại|thời kỳ|nhà trần|nhà lê|nhà nguyễn|phong kiến/i.test(sourceText)) detectedTypes.push("Triều đại / thời kỳ");
    if (/chủ tịch|đại tướng|tướng|vua|lãnh tụ|de castries/i.test(sourceText)) detectedTypes.push("Nhân vật lịch sử");
    if (/hiệp định|hội nghị|ngoại giao|tuyên ngôn|đàm phán|chính trị/i.test(sourceText)) detectedTypes.push("Chính trị / ngoại giao");
    if (/kinh tế|thương mại|sản xuất|cải cách/i.test(sourceText)) detectedTypes.push("Kinh tế");
    if (/văn hóa|tư tưởng|giáo dục|tôn giáo/i.test(sourceText)) detectedTypes.push("Văn hóa / xã hội");
    if (/khoa học|kỹ thuật|công nghệ|vũ khí/i.test(sourceText)) detectedTypes.push("Khoa học / kỹ thuật");
    if (detectedTypes.length === 0) detectedTypes.push("Sự kiện lịch sử", "Quan hệ giữa các sự kiện");

    // 4. Tách câu xử lý
    const sentences = cleanText.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 15);
    const introSentence = sentences[0] || cleanText.substring(0, 140);
    const coreSentence = sentences[Math.floor(sentences.length / 2)] || sentences[1] || introSentence;
    const conclusionSentence = sentences[sentences.length - 1] || sentences[2] || introSentence;

    // 5. Timeline
    const timelineMatches = [];
    const timeRegex = /(?:\b(?:năm|ngày|tháng|thế kỷ|nửa đầu|nửa cuối|giai đoạn|thời kỳ|đợt)\s+[\w\d\/\-]+|\b(?:1\d{3}|20\d{2})\b)/gi;
    for (const line of rawLines) {
      if (timeRegex.test(line) && line.length < 190) {
        const match = line.match(timeRegex);
        const timeStr = match ? match[0] : 'Mốc then chốt';
        const eventStr = line.replace(timeRegex, '').replace(/^[:\-\s]+/, '').trim() || line;
        timelineMatches.push({ time: timeStr, event: distillText(eventStr, 14) });
        if (timelineMatches.length >= 4) break;
      }
    }
    if (timelineMatches.length === 0) {
      const stepCount = Math.min(sentences.length, 3);
      for (let i = 0; i < stepCount; i++) {
        timelineMatches.push({ time: `Giai đoạn ${i + 1}`, event: distillText(sentences[i], 14) });
      }
    }

    // 6. Nhân vật / Đối tượng
    const charMatches = [];
    const charRegex = /(?:Chủ tịch\s+[A-ZÀ-Ỹ][\w\s]+|Đại tướng\s+[A-ZÀ-Ỹ][\w\s]+|Tướng\s+[A-Za-z\s]+|Bộ chỉ huy|Quân đội nhân dân|Nhân dân|Thực dân Pháp|Đế quốc Mĩ|Quân giải phóng)/gi;
    const foundChars = sourceText.match(charRegex);
    if (foundChars && foundChars.length > 0) {
      const uniqueChars = Array.from(new Set(foundChars.map(c => c.trim()))).slice(0, 3);
      uniqueChars.forEach(c => {
        charMatches.push(`• **${c}:** Chỉ huy / lực lượng nòng cốt tác động trực tiếp đến tiến trình sự kiện.`);
      });
    } else {
      charMatches.push(`• **Lực lượng quần chúng & Chỉ huy:** Đóng vai trò quyết định thắng lợi được nêu trong văn bản nguồn.`);
    }

    // 7. Địa điểm
    const locMatches = [];
    const locRegex = /(?:Điện Biên Phủ|Mường Thanh|Him Lam|Độc Lập|Bản Kéo|Đồi A1|Hà Nội|Sài Gòn|Bến Tre|Việt Bắc|Tân Trào|Giơ-ne-vơ|Ba Đình)/gi;
    const foundLocs = sourceText.match(locRegex);
    if (foundLocs && foundLocs.length > 0) {
      const uniqueLocs = Array.from(new Set(foundLocs.map(l => l.trim()))).slice(0, 3);
      uniqueLocs.forEach(l => {
        locMatches.push(`• **${l}:** Vị trí chiến lược diễn ra các hoạt động mấu chốt của sự kiện.`);
      });
    } else {
      locMatches.push(`• **Địa bàn trọng điểm:** Không gian chiến lược được xác lập theo tư liệu nguồn.`);
    }

    // 8. Trọng tâm cốt lõi (Key Takeaways)
    const takeaways = [];
    for (let i = 0; i < sentences.length; i++) {
      if (takeaways.length >= 4) break;
      const s = sentences[i];
      if (s.length >= 25 && s.length <= 220) takeaways.push(s);
    }
    if (takeaways.length === 0) takeaways.push(cleanText.substring(0, 160));
    const coreBullets = takeaways.map(s => {
      const tag = extractTag(s);
      const detail = distillText(s.replace(tag, '').replace(/^[:\-\s,]+/, ''), 16) || distillText(s, 16);
      return `• **[${tag}]:** ${detail}`;
    }).join('\n');

    // 9. Timeline Markdown
    let timelineMd = timelineMatches.map((item, idx) => {
      return `[${item.time}]\n${item.event}\n→ Nhân vật: Lực lượng thực hiện nhiệm vụ trọng yếu\n→ Kết quả: Tạo bước ngoặt phát triển sự kiện`;
    }).join('\n\n');
    if (timelineMatches.length >= 2) {
      timelineMd += `\n\n**Chuỗi quan hệ:** ` + timelineMatches.map(m => m.time).join(' → ');
    }

    // 10. Knowledge Graph ASCII
    const kgNodeA = extractTag(introSentence);
    const kgNodeB = extractTag(coreSentence);
    const kgNodeC = extractTag(conclusionSentence);
    const knowledgeGraphAscii = `\`\`\`
[${kgNodeA}]
    ↓ xuất phát điểm / nguyên nhân
[${kgNodeB}]
    ↓ diễn biến & đột phá then chốt
[${kgNodeC}]
    ↓ dẫn đến kết quả
[Thắng lợi & Bước ngoặt lịch sử]
\`\`\``;

    // 11. Memory Anchors
    const memoryAnchorsMd = `[FACT]
${distillText(introSentence, 22)}

[MEMORY ANCHOR]
Hình ảnh sa bàn chiến dịch rực sáng ngọn lửa quyết chiến, lá cờ đỏ sao vàng tung bay trên cao điểm.

[FACT]
${distillText(conclusionSentence, 22)}

[MEMORY ANCHOR]
Biểu tượng chiếc đồng hồ cát đảo chiều — đánh dấu bước ngoặt chuyển bại thành thắng của lịch sử.`;

    // 12. Dữ liệu không gian 3D
    let spatial3DMd = `• **Scene:** Không gian học tập Cung điện ký Ức / Sa bàn tương tác 3D.
• **Location:** ${locMatches[0] ? locMatches[0].replace(/^[•\s*]+/, '') : 'Vị trí trọng tâm căn phòng'}.
• **Characters:** ${charMatches[0] ? charMatches[0].replace(/^[•\s*]+/, '') : 'Nhân vật lịch sử tiêu biểu'}.
• **Objects:** Bản đồ chiến dịch, sa bàn công sự, tài liệu hiệp định lịch sử.
• **Actions:** Mô phỏng mũi tên tiến công và cắm cờ chiến thắng.`;
    if (actionTag) spatial3DMd += `\n• **Interactive:** ${actionTag}`;

    // 13. Flashcards
    const flashcardsMd = `Hỏi: Mục tiêu và ý nghĩa lớn nhất của sự kiện được nêu là gì?
Đáp: ${distillText(introSentence, 20)}

Hỏi: Bước đột phá hoặc cơ chế hành động mấu chốt diễn ra ra sao?
Đáp: ${distillText(coreSentence, 20)}

Hỏi: Đúc kết lịch sử quan trọng nhất cần ghi nhớ là gì?
Đáp: ${distillText(conclusionSentence, 20)}`;

    return `# HISTORICAL KNOWLEDGE MAP

## 1. Tổng quan
${distillText(introSentence, 24)} ${conclusionSentence && conclusionSentence !== introSentence ? distillText(conclusionSentence, 20) : ''}

## 2. Loại kiến thức
${detectedTypes.join(' • ')}

## 3. Kiến thức cốt lõi
${coreBullets}

## 4. Timeline
${timelineMd}

## 5. Nhân vật / Đối tượng
${charMatches.join('\n')}

## 6. Địa điểm
${locMatches.join('\n')}

## 7. Nguyên nhân → Diễn biến → Kết quả
• **Nguyên nhân:** Bối cảnh chiến lược và yêu cầu khách quan buộc các bên phải hành động.
• **Diễn biến:** Trải qua các giai đoạn then chốt: ${timelineMatches.map(m => m.event).join('; ')}.
• **Kết quả & Tác động:** ${distillText(conclusionSentence, 25)}.

## 8. Knowledge Graph
${knowledgeGraphAscii}

## 9. Memory Anchors
${memoryAnchorsMd}

## 10. Dữ liệu không gian 3D
${spatial3DMd}

## 11. Kiến thức cần nhớ
• **Bản chất:** ${distillText(introSentence, 15)}
• **Trọng tâm:** ${distillText(coreSentence, 15)}
• **Ý nghĩa:** ${distillText(conclusionSentence, 15)}

## 12. Kiểm tra ghi nhớ
${flashcardsMd}`;
  }
}

// Gắn hàm toàn cục để các trang và module khác có thể tái sử dụng ngay lập tức
if (typeof window !== 'undefined') {
  window.generateUniversalOfflineSummary = function(sourceText, format) {
    const helper = new AIAssistant();
    return helper.generateUniversalOfflineSummaryInternal(sourceText, format);
  };
}
