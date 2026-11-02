import json
import re
import os

txt_path = r'd:\NCKH\AI trợ lý\tri_thuc_lich_su_12.txt'
with open(txt_path, 'r', encoding='utf-8') as f:
    text = f.read()

pattern = r'(?=(?:CHỦ ĐỀ|Chủ đề|BÀI|Bài)\s+\d+)'
sections = re.split(pattern, text)

structured_topics = []
current_topic = 'Tổng quan'

for sec in sections:
    sec = sec.strip()
    if not sec:
        continue
    first_line = sec.split('\n')[0].strip()
    if 'CHỦ ĐỀ' in first_line.upper():
        current_topic = first_line
        continue
    
    title = first_line
    structured_topics.append({
        'chu_de': current_topic,
        'bai': title,
        'content': sec
    })

print(f'Parsed {len(structured_topics)} lessons.')

header = '''/**
 * KHO TRI THỨC LỊCH SỬ 12 - ÔN THI TỐT NGHIỆP THPT (CHƯƠNG TRÌNH MỚI 2018)
 * Nạp từ tài liệu chính thức: TÀI LIỆU CHỈ ÔN LÝ THUYẾT TN THPT.docx
 * Bao gồm đầy đủ 6 Chủ đề lớn và 16 Bài học trọng tâm
 */

window.HISTORICAL_KNOWLEDGE_BASE = ''' + json.dumps(structured_topics, ensure_ascii=False, indent=2) + ''';

// Bản tóm lược cốt lõi toàn bộ 6 Chủ đề
window.HISTORICAL_CORE_SUMMARY = `
=== TỔNG HỢP KIẾN THỨC CỐT LÕI 6 CHỦ ĐỀ LỊCH SỬ 12 (16 BÀI) ===
CHỦ ĐỀ 1: THẾ GIỚI TRONG VÀ SAU CHIẾN TRANH LẠNH (Bài 1, 2, 3)
- 1/1/1942: 26 nước ký Tuyên bố LHQ. 2/1945: Hội nghị Ianta quyết định lập LHQ. 24/10/1945: Hiến chương có hiệu lực (Ngày LHQ). 5 nước thường trực: Mỹ, Liên Xô/Nga, Anh, Pháp, Trung Quốc. Việt Nam gia nhập 20/9/1977 (thành viên 149).
- Trật tự hai cực Ianta (1945-1991): Xô - Mỹ đối đầu gay gắt. 12/1989: Tuyên bố chấm dứt Chiến tranh Lạnh tại Manta. 1991: Liên Xô tan rã, trật tự 2 cực sụp đổ, thế giới chuyển sang đa cực.

CHỦ ĐỀ 2: ASEAN NHỮNG CHẶNG ĐƯỜNG LỊCH SỬ (Bài 4, 5)
- 8/8/1967: Thành lập ASEAN tại Băng Cốc (5 nước sáng lập: In-đô, Ma-lai, Phi, Sing, Thái). 1995: Việt Nam gia nhập (thành viên thứ 7).
- 22/11/2015: Thành lập Cộng đồng ASEAN với 3 trụ cột: APSC (Chính trị - An ninh), AEC (Kinh tế), ASCC (Văn hóa - Xã hội).

CHỦ ĐỀ 3: CÁCH MẠNG T8, KHÁNG CHIẾN CHỐNG PHÁP, MỸ VÀ BẢO VỆ TỔ QUỐC (Bài 6, 7, 8, 9)
- 19/8/1945: Khởi nghĩa giành chính quyền ở Hà Nội. 2/9/1945: Bác Hồ đọc Tuyên ngôn Độc lập tại Ba Đình. Mẹo Loci: Gắn tại Cửa chính.
- Kháng chiến chống Pháp: 1946 Toàn quốc kháng chiến, 1947 Chiến dịch Việt Bắc (phá tan đánh nhanh thắng nhanh), 1950 Chiến dịch Biên giới (giành thế chủ động).
- 7/5/1954: Chiến thắng Điện Biên Phủ (đập tan kế hoạch Nava). 21/7/1954: Hiệp định Giơ-ne-vơ (lấy vĩ tuyến 17 làm giới tuyến quân sự tạm thời).
- Kháng chiến chống Mỹ: 1959-1960 Đồng Khởi Bến Tre. Đánh bại 4 chiến lược: Chiến tranh đặc biệt, Cục bộ, Việt Nam hóa chiến tranh, Điện Biên Phủ trên không (12/1972). 27/1/1973: Hiệp định Pari (Mỹ rút quân).
- Xuân 1975: Chiến dịch Tây Nguyên (4-24/3/1975), Huế - Đà Nẵng (21-29/3/1975), Chiến dịch Hồ Chí Minh (26-30/4/1975 giải phóng Sài Gòn, thống nhất đất nước).

CHỦ ĐỀ 4: CÔNG CUỘC ĐỔI MỚI Ở VIỆT NAM TỪ NĂM 1986 ĐẾN NAY (Bài 10, 11)
- 12/1986: Đại hội Đảng VI mở đầu công cuộc Đổi mới toàn diện: Chuyển từ kinh tế bao cấp sang kinh tế thị trường định hướng XHCN, đa phương hóa quan hệ quốc tế.

CHỦ ĐỀ 5: ĐỐI NGOẠI VIỆT NAM THỜI CẬN - HIỆN ĐẠI (Bài 12, 13)
- Hoạt động của Phan Bội Châu (Đông Du), Phan Châu Trinh (Duy Tân), Nguyễn Ái Quốc (tìm đường cứu nước 1911, Luận cương Lênin 1920, thành lập ĐCSVN 1930).
- Sau 1975: Phá thế bao vây cô lập. 1995: Bình thường hóa quan hệ Việt - Mỹ, gia nhập ASEAN. Trường phái Ngoại giao cây tre: Gốc vững, thân chắc, cành uyển chuyển.

CHỦ ĐỀ 6: HỒ CHÍ MINH TRONG LỊCH SỬ VIỆT NAM (Bài 14, 15, 16)
- 5/6/1911: Xuất phát tại Bến Nhà Rồng. 1941: Về Pác Bó thành lập Mặt trận Việt Minh. 1969: Di chúc để lại muôn vàn tình thương yêu. Anh hùng giải phóng dân tộc & Danh nhân văn hóa kiệt xuất.
`;

// Hàm thông minh trích xuất kiến thức phù hợp nhất với câu hỏi của học sinh (In-Browser RAG)
window.getRelevantHistoricalKnowledge = function(query) {
    if (!query || !window.HISTORICAL_KNOWLEDGE_BASE) return window.HISTORICAL_CORE_SUMMARY;
    
    const qLower = query.toLowerCase();
    
    // Tìm các bài học có độ trùng khớp cao nhất với câu hỏi
    const scored = window.HISTORICAL_KNOWLEDGE_BASE.map(item => {
        let score = 0;
        const text = (item.bai + ' ' + item.content).toLowerCase();
        
        // Trọng số tiêu đề bài học
        const titleWords = item.bai.toLowerCase().split(/[\\s,.-]+/);
        titleWords.forEach(w => {
            if (w.length > 2 && qLower.includes(w)) score += 6;
        });
        
        // Kiểm tra các từ khóa quan trọng
        const sampleKeywords = ['ianta', 'liên hợp quốc', 'lhq', 'asean', 'pháp', 'mỹ', 'điện biên phủ', 'giơnevơ', 'giơ-ne-vơ', 'pari', 'đồng khởi', '1945', '1954', '1975', '1986', 'đổi mới', 'hồ chí minh', 'bác hồ', 'tây nguyên', 'vĩ tuyến 17', 'việt bắc', 'biên giới', 'trật tự thế giới', 'chiến tranh lạnh'];
        sampleKeywords.forEach(kw => {
            if (qLower.includes(kw) && text.includes(kw)) score += 8;
        });

        // Điểm xuất hiện câu hỏi
        const qWords = qLower.split(/[\\s,.-]+/).filter(w => w.length > 2);
        qWords.forEach(w => {
            if (text.includes(w)) score += 1;
        });

        return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Lấy top 2 bài học điểm cao nhất nếu có liên quan
    const topMatches = scored.filter(s => s.score >= 6).slice(0, 2);
    
    if (topMatches.length > 0) {
        let injected = '=== TRI THỨC TRỌNG TÂM TRÍCH TỪ TÀI LIỆU ÔN THI TN THPT ===\\n';
        topMatches.forEach(m => {
            injected += '\\n[' + m.item.chu_de + ' - ' + m.item.bai + ']:\\n' + m.item.content + '\\n';
        });
        return injected;
    }

    // Nếu hỏi chung hoặc câu hỏi khái quát, trả về bản tóm tắt cốt lõi toàn bộ 6 chủ đề
    return window.HISTORICAL_CORE_SUMMARY;
};
'''

out_file = r'd:\NCKH\history_knowledge_base.js'
with open(out_file, 'w', encoding='utf-8') as f:
    f.write(header)

print(f'Wrote {len(header)} characters to {out_file}')
