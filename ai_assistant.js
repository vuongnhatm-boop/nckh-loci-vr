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
    if (!storedKey || storedKey.includes('Ab8RN6Lg6pRdYMPO4')) {
      storedKey = 'AQ.Ab8RN6LNaNbKGPSWpIdOAZMkm5k5X-5vAcXb0smx5CwmVL94PA';
      localStorage.setItem('loci_gemini_api_key', storedKey);
    }
    this.apiKey = storedKey;
    
    // Tự động chọn model mới nhất (ưu tiên gemini-3.5-flash)
    let savedModel = localStorage.getItem('loci_gemini_model');
    if (!savedModel || savedModel.includes('1.5') || savedModel === 'gemini-2.5-flash-lite' || savedModel === 'gemini-2.5-flash') {
      savedModel = 'gemini-3.5-flash';
      localStorage.setItem('loci_gemini_model', savedModel);
    }
    this.modelName = savedModel;

    // Danh sách model ưu tiên tự động chuyển đổi nếu bị nghẽn quota
    this.candidateModels = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash'];

    // State: 'idle' | 'listening' | 'thinking' | 'speaking'
    this.state = 'idle';
    this.chatHistory = [];
    this.answerDepth = 'detailed'; // 'short' | 'standard' | 'detailed'

    // Web Speech API
    this.recognition = null;
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.speechRate = 1.05;
    this.isListening = false;
    this.autoSendTimer = null;
    this.accumulatedTranscript = '';
    this.wakeWordListening = true;
    this.speechQueue = [];
    this.currentSpeechIndex = 0;

    this.initSpeech();
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
    this.speechRate = parseFloat(rate) || 1.05;
  }

  setVoice(voice) {
    this.voice = voice;
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

    // 2. Speech Synthesis (Text to Speech tiếng Việt)
    if (this.synth) {
      const loadVoices = () => {
        const voices = this.synth.getVoices();
        this.voice = voices.find(v => v.lang.startsWith('vi') || v.lang.includes('VN')) || null;
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
    if (!this.synth) return;
    this.stopSpeaking();

    let cleanSpeech = text
      .replace(/\[ACTION:[^\]]+\]/gi, '')
      .replace(/[*#_~`]/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    // Chuẩn hoá phát âm tiếng Việt: Viết "Loci" nhưng đọc là "lo-xi"
    cleanSpeech = cleanSpeech.replace(/\bloci\b/gi, 'lo-xi');

    if (!cleanSpeech) return;

    // Tách thành từng câu nhỏ theo dấu chấm, chấm than, chấm hỏi để trình duyệt đọc liên tục không bị cắt ngang
    const rawSentences = cleanSpeech.match(/[^.!?]+[.!?]*/g) || [cleanSpeech];
    this.speechQueue = [];
    rawSentences.forEach(s => {
      const trimmed = s.trim();
      if (trimmed.length > 0) this.speechQueue.push(trimmed);
    });

    this.currentSpeechIndex = 0;
    this.speakNextSpeechChunk();
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
    utterance.rate = this.speechRate || 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.setState('speaking');
    };
    utterance.onend = () => {
      this.currentSpeechIndex++;
      this.speakNextSpeechChunk();
    };
    utterance.onerror = (e) => {
      console.warn('TTS chunk error:', e);
      this.currentSpeechIndex++;
      this.speakNextSpeechChunk();
    };

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    this.speechQueue = [];
    if (this.synth) {
      this.synth.cancel();
      this.setState('idle');
      if (this.wakeWordListening && !this.isListening && this.recognition) {
        try { this.recognition.start(); } catch (e) {}
      }
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

    // Nạp tri thức đầy đủ từ tài liệu 16 bài học SGK Lịch Sử 12
    const docxKnowledge = (typeof window !== 'undefined' && window.getRelevantHistoricalKnowledge) 
      ? window.getRelevantHistoricalKnowledge(userInput) 
      : (typeof window !== 'undefined' && window.HISTORICAL_CORE_SUMMARY ? window.HISTORICAL_CORE_SUMMARY : '');

    return `
Bạn là "Loci Assistant" — Trí tuệ Nhân tạo kiêm GIÁM KHẢO KHẢO THÍ KHÔNG GIAN (Spatial Knowledge Examiner) trong Cung Điện Ký Ức (Method of Loci) phục vụ ôn thi tốt nghiệp THPT môn Lịch Sử 12.
- QUY TẮC TÊN GỌI: Tên của bạn luôn viết là "Loci", nhưng khi đọc hoặc phát âm tiếng Việt thì đọc là "lo-xi". Nếu người dùng hỏi tên hoặc cách đọc, hãy giải thích tên viết là Loci (phương pháp Cung điện Ký ức Loci) và đọc chuẩn là "lo-xi".
Bạn được nạp toàn bộ kiến thức 6 Chủ đề (16 Bài học) trong SGK Lịch Sử 12 của Bộ GD&ĐT.
Bạn GHI NHỚ TOÀN DIỆN tiến trình học, độ thuộc bài, chuỗi streak và những điểm yếu của học sinh qua các lần kiểm tra.
Bạn giao tiếp bằng tiếng Việt chuẩn mực, cuốn hút, chuẩn xác 100% về mặt sự kiện và số liệu lịch sử.

=== VAI TRÒ KHẢO THÍ KIẾN THỨC KHÔNG GIAN (SPATIAL MEMORY EXAMINER) ===
1. Khảo sát liên tưởng Vị trí 3D <-> Sự kiện Lịch sử:
   - Phương pháp Loci gắn liền vị trí đồ vật trong phòng với sự kiện lịch sử (năm, diễn biến, ý nghĩa, mẹo nhớ).
   - Khi người dùng muốn khảo bài, kiểm tra, đố bài ("Khảo bài tôi đi", "Kiểm tra kiến thức không gian", "Đố tôi", "Bắt đầu bài thi"):
     + Hãy chủ động đưa ra một câu hỏi khảo thí không gian độc đáo (ví dụ: "Tại [Tên đồ vật], bạn đã neo giữ sự kiện lịch sử nào?" hoặc "Sự kiện [Tên sự kiện] được đặt tại đồ vật nào?") kèm 4 đáp án A, B, C, D rõ ràng.
     + Kèm theo tag [ACTION:QUIZ_START] hoặc [ACTION:TELEPORT:<id_mốc>] để kích hoạt bài thi tương tác trên giao diện 3D.
2. Báo cáo & Phân tích Trí nhớ tiến trình:
   - Khi người dùng hỏi: "Tiến trình của tôi", "Tôi học được bao nhiêu rồi", "Mốc nào tôi còn yếu", "Xem tiến trình":
     + Đưa ra nhận xét súc tích dựa trên số liệu thực tế trong Hồ sơ tiến trình bên dưới. Khen ngợi chuỗi trả lời đúng (streak) và chỉ rõ mốc nào cần ôn lại.
     + Kèm theo tag [ACTION:PROGRESS_OPEN] để tự động mở bảng điều khiển tiến trình cho người dùng.
3. Đánh giá và cập nhật trạng thái mốc ký ức:
   - Nếu học sinh trả lời đúng xuất sắc trong chat: Khen ngợi nhiệt liệt và chèn tag [ACTION:STATUS:<id_mốc>:mastered]
   - Nếu học sinh trả lời sai/nhầm lẫn: Giải thích cặn kẽ vì sao nhầm và chèn tag [ACTION:STATUS:<id_mốc>:reviewing] kèm [ACTION:TELEPORT:<id_mốc>] để đưa người dùng tới quan sát mốc.

=== HỒ SƠ TIẾN TRÌNH & GHI NHỚ CỦA HỌC SINH HIỆN TẠI ===
${progressMemoryPrompt}

=== DANH SÁCH MỐC KÝ ỨC TRONG CUNG ĐIỆN ===
${lociSummary || 'Chưa có mốc nào.'}

=== TÀI LIỆU LÝ THUYẾT SGK LỊCH SỬ 12 (16 BÀI HỌC) ĐÃ NẠP SẴN ===
${docxKnowledge}

=== CƠ CHẾ TRẢ LỜI & ĐIỀU KHIỂN KHÔNG GIAN 3D (BẮT BUỘC TUÂN THỦ) ===
- NGUYÊN TẮC VÀNG: TRẢ LỜI TRỰC DIỆN VÀO TRỌNG TÂM CÂU HỎI. Hỏi gì đáp nấy, không mở bài vòng vo! Tuyệt đối không dùng tiếng Anh, không để lộ suy nghĩ nội tâm.
  + Nếu hỏi về Ý nghĩa: Tập trung phân tích sâu sắc các tầng ý nghĩa lịch sử (dân tộc & quốc tế).
  + Nếu hỏi về Diễn biến: Trình bày rõ các giai đoạn, ngày/tháng/năm then chốt.
  + Nếu hỏi về Bối cảnh/Nguyên nhân: Phân tích hoàn cảnh trong nước, quốc tế và chủ trương của Đảng.
  + Nếu hỏi so sánh: Đối chiếu điểm giống và khác nhau rõ ràng.
- MỨC ĐỘ CHI TIẾT & ĐỘ DÀI THEO YÊU CẦU:
  ${this.answerDepth === 'short' 
    ? '+ CHẾ ĐỘ NGẮN (100 - 150 từ): Cực kỳ súc tích, chỉ nêu gạch đầu dòng các ý quan trọng nhất, đi thẳng vào bản chất.' 
    : this.answerDepth === 'standard' 
      ? '+ CHẾ ĐỘ TIÊU CHUẨN (300 - 500 từ): Trình bày đầy đủ các luận điểm chính, diễn biến và ý nghĩa cơ bản.' 
      : '+ CHẾ ĐỘ GIẢNG CHI TIẾT SÂU (600 - 1000 từ): Giảng giải tường tận, sâu sắc, phân tích đa chiều về nguyên nhân, các bước diễn biến, ý nghĩa lịch sử to lớn (trong nước & quốc tế), bài học kinh nghiệm và liên hệ phương pháp ghi nhớ Loci.'}
- CÁC TAG HÀNH ĐỘNG KHÔNG GIAN HỢP LỆ:
  + [ACTION:TELEPORT:<id_mốc>] : Bay camera tới mốc
  + [ACTION:QUIZ_START] : Bật giao diện khảo thí không gian 3D
  + [ACTION:PROGRESS_OPEN] : Mở bảng báo cáo tiến trình học tập
  + [ACTION:DISMISS] : Tự động trượt đóng trợ lý khi người dùng yêu cầu rời đi / tắt / tạm biệt
  + [ACTION:STATUS:<id_mốc>:mastered] : Đánh dấu mốc đã thuộc sâu
  + [ACTION:STATUS:<id_mốc>:reviewing] : Đánh dấu mốc cần ôn lại
- KHI NGƯỜI DÙNG YÊU CẦU RỜI ĐI / TẮT TRỢ LÝ / NÓI "OKE BẠN":
  Hãy luôn đáp lại lịch sự bắt đầu bằng "Oke bạn!..." và chèn tag [ACTION:DISMISS] ở cuối để trợ lý tự động trượt đóng lại.
  Ví dụ: "Oke bạn! Tôi tạm ẩn đi nhé, khi nào cần bạn cứ gọi Loci nha! [ACTION:DISMISS]"
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

    // 1. Kiểm tra ngay lập tức xem có ý định bay đến mốc hay không
    const matchedLocus = this.matchLocusIntent(userInput, lociList);
    const isNavigationIntent = /đưa|đi|tới|đến|bay|xem|mở/i.test(userInput) || matchedLocus;

    if (matchedLocus && isNavigationIntent) {
      console.log('📍 Phát hiện yêu cầu điều hướng tới:', matchedLocus.name);
      this.onAction({ type: 'teleport', locus: matchedLocus });
    }

    // 2. Nếu chưa có API Key, chạy chế độ Phản hồi Offline chuẩn xác
    if (!this.apiKey) {
      setTimeout(() => {
        this.fallbackOfflineResponse(userInput, context, matchedLocus);
      }, 300);
      return;
    }

    const systemInstruction = this.buildSystemInstruction(context, userInput);
    const modelsToTry = [
      this.modelName,
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite-preview',
      'gemini-2.5-flash'
    ].filter((v, i, a) => a.indexOf(v) === i); // Loại bỏ trùng lặp

    let successResponse = null;
    let successfulModel = this.modelName;

    for (const model of modelsToTry) {
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
            temperature: 0.7,
            maxOutputTokens: 3500
          }
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          successResponse = await response.json();
          successfulModel = model;
          break; // Thành công, thoát vòng lặp
        } else {
          console.warn(`Model ${model} trả về mã lỗi ${response.status}, thử model tiếp theo...`);
        }
      } catch (e) {
        console.warn(`Lỗi khi gọi model ${model}:`, e);
      }
    }

    if (successResponse) {
      this.modelName = successfulModel;
      localStorage.setItem('loci_gemini_model', successfulModel);

      let aiReply = successResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'Tôi đã nghe bạn, hãy xem mốc trên màn hình nhé!';
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
      console.warn('Tất cả các model Gemini đều không khả dụng, chuyển sang chế độ Offline.');
      this.fallbackOfflineResponse(userInput, context, matchedLocus);
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

  /* --- CHẾ ĐỘ PHẢN HỒI THÔNG MINH OFFLINE --- */
  fallbackOfflineResponse(input, context, directLocus = null) {
    const lower = input.toLowerCase();
    const lociList = context.lociList || this.getContext().lociList || [];

    let reply = '';
    const locus = directLocus || this.matchLocusIntent(input, lociList);

    if (this.matchDismissIntent(input)) {
      reply = 'Oke bạn! Tôi xin phép tạm ẩn đi nhé, khi nào cần học bài bạn cứ gọi Loci nhé! [ACTION:DISMISS]';
      this.onAction({ type: 'dismiss' });
    } else if (locus) {
      reply = `Đang đưa bạn đến mốc "${locus.name}" (${locus.year}) tại vị trí ${locus.locName}! Mẹo nhớ: ${locus.mnemonic}`;
      this.onAction({ type: 'teleport', locus });
    } else if (lower.includes('kiểm tra') || lower.includes('khảo bài') || lower.includes('đố tôi') || lower.includes('bài thi') || lower.includes('trắc nghiệm')) {
      const q = this.generateSpatialQuestion(lociList);
      if (q) {
        reply = `🧠 [KHẢO THÍ KHÔNG GIAN LOCI]\n${q.question}\n\n` +
          q.options.map(o => `${o.label}. ${o.text}`).join('\n') +
          `\n\n(Bạn hãy chọn đáp án hoặc bấm nút bắt đầu thi 3D nhé!) [ACTION:QUIZ_START] [ACTION:TELEPORT:${q.targetLocus.id}]`;
        this.onAction({ type: 'quiz_start', questionData: q });
      } else {
        reply = 'Bạn hãy thêm một vài mốc vào phòng trước khi bắt đầu bài khảo thí không gian nhé!';
      }
    } else if (lower.includes('tiến trình') || lower.includes('báo cáo') || lower.includes('điểm yếu') || lower.includes('kỷ lục') || lower.includes('streak') || lower.includes('bao nhiêu')) {
      const summary = this.progressManager.getStatsSummary(lociList);
      reply = `📊 TIẾN TRÌNH HỌC TẬP KHÔNG GIAN:\n` +
        `• Đã làm: ${summary.totalAnswered} câu (Đúng ${summary.correctCount} - Đạt ${summary.accuracy}%)\n` +
        `• Chuỗi đúng hiện tại: ${summary.currentStreak} 🔥 (Kỷ lục: ${summary.bestStreak} 🏆)\n` +
        `• Mốc thuộc sâu: ${summary.masteredCount}/${summary.totalLoci} mốc.\n` +
        `Tôi đang mở bảng tiến trình học tập chi tiết cho bạn! [ACTION:PROGRESS_OPEN]`;
      this.onAction({ type: 'progress_open' });
    } else {
      reply = `Tôi đã nghe: "${input}". Bạn có thể ra lệnh: "Khảo bài không gian", "Đưa tôi đến Điện Biên Phủ", hoặc nói "Rời đi" nhé!`;
    }

    this.onMessage({ role: 'assistant', text: reply });
    this.speak(reply);
  }
}
