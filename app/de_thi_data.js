/* =====================================================================
   NGÂN HÀNG ĐỀ THI LỊCH SỬ · CHỦ ĐỀ 3 (LỚP 12)
   Cấu trúc đề: 24 câu trắc nghiệm (0,25 đ/câu) + 4 câu đúng/sai (0,1 – 0,25 – 0,5 – 1,0 đ)
   Thời gian: 50 phút · Tổng điểm: 10
   Nguồn nội dung: "chủ đề 3 có ảnh.docx" (bài 6, 7, 8), biên soạn theo cấu trúc đề THPT.
   Mỗi bài có pool câu hỏi lớn hơn 1 đề để bốc ngẫu nhiên, tạo nhiều đề khác nhau.
   ===================================================================== */
window.EXAM_BANK = {
    meta: {
        title: "Chủ đề 3: Cách mạng tháng Tám, chiến tranh giải phóng và bảo vệ Tổ quốc (1945 – nay)",
        subject: "Lịch sử",
        grade: 12,
        durationMin: 50,
        part1: { count: 24, perQuestion: 0.25 },
        part2: { count: 4, scoring: [0, 0.1, 0.25, 0.5, 1] }
    },

    /* =================================================================
       BÀI 6 — CÁCH MẠNG THÁNG TÁM NĂM 1945
       ================================================================= */
    bai_6: {
        id: "bai_6",
        title: "Bài 6: Cách mạng tháng Tám năm 1945",
        short: "Bài 6",
        topics: {
            boi_canh: "Bối cảnh lịch sử",
            chuan_bi: "Chuẩn bị Tổng khởi nghĩa",
            dien_bien: "Diễn biến Tổng khởi nghĩa",
            nguyen_nhan: "Nguyên nhân thắng lợi",
            y_nghia: "Ý nghĩa lịch sử",
            bai_hoc: "Bài học kinh nghiệm"
        },
        mcq: [
            { id: "b6_q01", topic: "boi_canh", lv: 1, q: "Tháng 8/1945, Chiến tranh thế giới thứ hai đang ở giai đoạn nào?", o: ["Bùng nổ và lan rộng khắp châu Âu", "Bước vào giai đoạn kết thúc", "Đã kết thúc hoàn toàn trên toàn thế giới", "Mới bắt đầu lan sang châu Á"], a: 1, ex: "Tháng 8/1945, Chiến tranh thế giới thứ hai bước vào giai đoạn kết thúc." },
            { id: "b6_q02", topic: "boi_canh", lv: 1, q: "Ngày 6/8/1945, Mỹ ném bom nguyên tử xuống thành phố nào của Nhật Bản?", o: ["Na-ga-xa-ki", "Hi-rô-si-ma", "Tô-ky-ô", "Ô-sa-ka"], a: 1, ex: "Ngày 6/8/1945, Mỹ ném bom nguyên tử xuống Hi-rô-si-ma; ngày 9/8 là Na-ga-xa-ki." },
            { id: "b6_q03", topic: "boi_canh", lv: 1, q: "Ngày 9/8/1945, quân đội Xô viết tấn công đạo quân nào của Nhật?", o: ["Quan Đông ở Đông Bắc Trung Quốc", "Quân Nhật ở Đông Dương", "Hạm đội Liên hợp ở Thái Bình Dương", "Quân Nhật ở Triều Tiên"], a: 0, ex: "Quân đội Xô viết tấn công đạo quân Quan Đông của Nhật ở Đông Bắc Trung Quốc." },
            { id: "b6_q04", topic: "boi_canh", lv: 1, q: "Ngày 15/8/1945, Nhật Bản tuyên bố nội dung gì?", o: ["Đầu hàng Đồng minh không điều kiện", "Tiếp tục chiến đấu đến cùng", "Ký hiệp ước hoà bình với Mỹ", "Rút quân khỏi Trung Quốc"], a: 0, ex: "Ngày 15/8/1945, Nhật tuyên bố đầu hàng Đồng minh không điều kiện." },
            { id: "b6_q05", topic: "boi_canh", lv: 1, q: "Sau ngày 15/8/1945, chính phủ tay sai ở Đông Dương do ai đứng đầu?", o: ["Bảo Đại", "Ngô Đình Diệm", "Trần Trọng Kim", "Phan Bội Châu"], a: 2, ex: "Chính phủ Trần Trọng Kim cùng quân Nhật ở Đông Dương hoang mang khi Nhật đầu hàng." },
            { id: "b6_q06", topic: "boi_canh", lv: 2, q: "Điều kiện khách quan thuận lợi cho Tổng khởi nghĩa tháng Tám xuất hiện khi nào?", o: ["Khi Nhật đảo chính Pháp (9/3/1945)", "Khi quân Đồng minh tiến vào Đông Dương", "Khi Nhật tuyên bố đầu hàng Đồng minh (15/8/1945)", "Khi Pháp rút khỏi Đông Dương (1946)"], a: 2, ex: "Nhật đầu hàng đã tạo điều kiện khách quan có lợi cho Tổng khởi nghĩa." },

            { id: "b6_q07", topic: "chuan_bi", lv: 1, q: "Từ tháng 3/1945 đến tháng 8/1945, dân tộc ta thực hiện phong trào nào?", o: ["Phá kho thóc, giải quyết nạn đói", "Cao trào kháng Nhật cứu nước", "Tổng khởi nghĩa giành chính quyền", "Kháng chiến toàn quốc chống Pháp"], a: 1, ex: "Cao trào kháng Nhật cứu nước diễn ra từ tháng 3 đến tháng 8/1945 trên cả nước." },
            { id: "b6_q08", topic: "chuan_bi", lv: 1, q: "Ngày 13/8/1945, Trung ương Đảng và Tổng bộ Việt Minh thành lập tổ chức nào?", o: ["Ủy ban Dân tộc giải phóng", "Ủy ban khởi nghĩa toàn quốc", "Chính phủ lâm thời", "Quân đội Giải phóng"], a: 1, ex: "Ngày 13/8/1945, Ủy ban khởi nghĩa toàn quốc được thành lập và ra Quân lệnh số 1." },
            { id: "b6_q09", topic: "chuan_bi", lv: 1, q: "“Quân lệnh số 1” (13/8/1945) có nội dung cơ bản là gì?", o: ["Kêu gọi nhân dân chống nạn đói", "Chính thức phát động Tổng khởi nghĩa trong cả nước", "Thành lập Ủy ban Dân tộc giải phóng", "Tuyên bố độc lập"], a: 1, ex: "Quân lệnh số 1 chính thức phát động Tổng khởi nghĩa trong cả nước." },
            { id: "b6_q10", topic: "chuan_bi", lv: 1, q: "Hội nghị toàn quốc của Đảng (14–15/8/1945) họp tại đâu?", o: ["Tân Trào (Tuyên Quang)", "Pác Bó (Cao Bằng)", "Chiêm Hoá (Tuyên Quang)", "Hà Nội"], a: 0, ex: "Hội nghị toàn quốc của Đảng họp tại Tân Trào (Tuyên Quang)." },
            { id: "b6_q11", topic: "chuan_bi", lv: 1, q: "Hội nghị toàn quốc của Đảng (14–15/8/1945) đã thông qua nội dung gì?", o: ["Kế hoạch lãnh đạo toàn dân Tổng khởi nghĩa và các vấn đề đối nội, đối ngoại", "Hiến pháp đầu tiên của nước Việt Nam", "Lời kêu gọi toàn quốc kháng chiến", "Chính sách cải cách ruộng đất"], a: 0, ex: "Hội nghị thông qua kế hoạch lãnh đạo toàn dân Tổng khởi nghĩa và quyết định các vấn đề đối nội, đối ngoại sau khi giành chính quyền." },
            { id: "b6_q12", topic: "chuan_bi", lv: 1, q: "Đại hội quốc dân (16–17/8/1945) được tổ chức tại đâu?", o: ["Chiêm Hoá", "Tân Trào", "Hà Nội", "Bắc Giang"], a: 1, ex: "Đại hội quốc dân họp ở Tân Trào (Tuyên Quang)." },
            { id: "b6_q13", topic: "chuan_bi", lv: 1, q: "Đại hội quốc dân (16–17/8/1945) quyết định thành lập cơ quan nào?", o: ["Chính phủ lâm thời", "Ủy ban Dân tộc giải phóng Việt Nam", "Quốc hội khoá I", "Mặt trận Việt Minh"], a: 1, ex: "Đại hội cử ra Ủy ban Dân tộc giải phóng Việt Nam do Hồ Chí Minh làm Chủ tịch." },
            { id: "b6_q14", topic: "chuan_bi", lv: 1, q: "Ai được cử làm Chủ tịch Ủy ban Dân tộc giải phóng Việt Nam?", o: ["Tôn Đức Thắng", "Võ Nguyên Giáp", "Hồ Chí Minh", "Nguyễn Lương Bằng"], a: 2, ex: "Hồ Chí Minh được cử làm Chủ tịch Ủy ban Dân tộc giải phóng Việt Nam." },
            { id: "b6_q15", topic: "chuan_bi", lv: 2, q: "Cao trào kháng Nhật cứu nước (3–8/1945) có ý nghĩa gì?", o: ["Lật đổ chính quyền phong kiến", "Chuẩn bị lực lượng, tập dượt quần chúng cho Tổng khởi nghĩa", "Đánh đuổi quân Đồng minh", "Kết thúc Chiến tranh thế giới thứ hai"], a: 1, ex: "Cao trào góp phần chuẩn bị lực lượng, tập dượt quần chúng đấu tranh, sẵn sàng tổng khởi nghĩa." },

            { id: "b6_q16", topic: "dien_bien", lv: 2, q: "Từ ngày 14/8/1945, việc phát động khởi nghĩa diễn ra như thế nào?", o: ["Chờ lệnh từ Tân Trào rồi mới hành động", "Các cấp bộ Đảng, Việt Minh căn cứ tình hình cụ thể ở địa phương phát động nhân dân khởi nghĩa", "Chỉ khởi nghĩa ở Hà Nội", "Khởi nghĩa đồng loạt theo giờ quy định trong cả nước"], a: 1, ex: "Từ 14/8/1945, nhiều cấp bộ Đảng và Việt Minh đã căn cứ tình hình địa phương để phát động khởi nghĩa." },
            { id: "b6_q17", topic: "dien_bien", lv: 1, q: "Chiều 16/8/1945, Võ Nguyên Giáp chỉ huy đơn vị Giải phóng quân tiến về đâu?", o: ["Cao Bằng", "Thái Nguyên", "Hà Nội", "Tuyên Quang"], a: 1, ex: "Đơn vị Giải phóng quân tiến về giải phóng tỉnh lị Thái Nguyên, mở đường về Hà Nội." },
            { id: "b6_q18", topic: "dien_bien", lv: 1, q: "Ngày 18/8/1945, những tỉnh nào giành chính quyền ở tỉnh lị sớm nhất trong cả nước?", o: ["Bắc Giang, Hải Dương, Hà Tĩnh, Quảng Nam", "Hà Nội, Huế, Sài Gòn, Đà Nẵng", "Thái Nguyên, Tuyên Quang, Cao Bằng, Lạng Sơn", "Bến Tre, Mỹ Tho, Cần Thơ, Sóc Trăng"], a: 0, ex: "Ngày 18/8, Bắc Giang, Hải Dương, Hà Tĩnh, Quảng Nam giành chính quyền ở tỉnh lị sớm nhất." },
            { id: "b6_q19", topic: "dien_bien", lv: 1, q: "Khởi nghĩa giành chính quyền ở Hà Nội thắng lợi vào ngày nào?", o: ["18/8/1945", "19/8/1945", "23/8/1945", "25/8/1945"], a: 1, ex: "Ngày 19/8/1945, khởi nghĩa thắng lợi ở Hà Nội." },
            { id: "b6_q20", topic: "dien_bien", lv: 1, q: "Ngày 23/8/1945, nhân dân giành chính quyền thắng lợi ở đâu?", o: ["Hà Nội", "Huế", "Sài Gòn", "Đà Nẵng"], a: 1, ex: "Ngày 23/8/1945, nhân dân chiếm các công sở, giành chính quyền ở Huế." },
            { id: "b6_q21", topic: "dien_bien", lv: 1, q: "Ngày 25/8/1945, nhân dân giành chính quyền thắng lợi ở đâu?", o: ["Huế", "Sài Gòn", "Hà Nội", "Hải Phòng"], a: 1, ex: "Ngày 25/8/1945, nhân dân giành chính quyền ở Sài Gòn." },
            { id: "b6_q22", topic: "dien_bien", lv: 1, q: "Địa phương giành chính quyền muộn nhất trong Cách mạng tháng Tám là", o: ["Đồng Nai Thượng và Hà Tiên", "Cao Bằng và Lạng Sơn", "Quảng Nam và Quảng Ngãi", "Cần Thơ và Sóc Trăng"], a: 0, ex: "Ngày 28/8/1945, Đồng Nai Thượng và Hà Tiên giành chính quyền muộn nhất." },
            { id: "b6_q23", topic: "dien_bien", lv: 1, q: "Sự kiện ngày 30/8/1945 là gì?", o: ["Bảo Đại tuyên bố thoái vị", "Hồ Chí Minh đọc Tuyên ngôn Độc lập", "Nhật ký văn kiện đầu hàng", "Quân Đồng minh vào Hà Nội"], a: 0, ex: "Chiều 30/8/1945, vua Bảo Đại tuyên bố thoái vị." },
            { id: "b6_q24", topic: "dien_bien", lv: 2, q: "Việc vua Bảo Đại thoái vị (30/8/1945) đánh dấu điều gì?", o: ["Chấm dứt ách thống trị của thực dân Pháp", "Chế độ phong kiến Việt Nam sụp đổ hoàn toàn", "Nhật Bản rút khỏi Đông Dương", "Kết thúc Cách mạng tháng Tám"], a: 1, ex: "Bảo Đại thoái vị đánh dấu chế độ phong kiến Việt Nam sụp đổ hoàn toàn." },
            { id: "b6_q25", topic: "dien_bien", lv: 1, q: "Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại đâu?", o: ["Quảng trường Ba Đình (Hà Nội)", "Nhà hát Lớn Hà Nội", "Quảng trường Ngọ Môn (Huế)", "Dinh Độc Lập (Sài Gòn)"], a: 0, ex: "Ngày 2/9/1945, tại Quảng trường Ba Đình (Hà Nội), Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập." },
            { id: "b6_q26", topic: "dien_bien", lv: 1, q: "Ngày 2/9/1945, thay mặt Chính phủ lâm thời, ai đọc Tuyên ngôn Độc lập?", o: ["Tôn Đức Thắng", "Võ Nguyên Giáp", "Hồ Chí Minh", "Huỳnh Thúc Kháng"], a: 2, ex: "Hồ Chí Minh thay mặt Chính phủ lâm thời đọc Tuyên ngôn Độc lập." },
            { id: "b6_q27", topic: "dien_bien", lv: 1, q: "Tuyên ngôn Độc lập (2/9/1945) khai sinh ra", o: ["nước Việt Nam Dân chủ Cộng hoà", "Việt Nam Cộng hoà", "Cộng hoà Xã hội chủ nghĩa Việt Nam", "Việt Nam Quốc gia"], a: 0, ex: "Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hoà." },
            { id: "b6_q28", topic: "dien_bien", lv: 3, q: "Sắp xếp các sự kiện theo đúng thứ tự thời gian: 1) Sài Gòn giành chính quyền; 2) Hà Nội giành chính quyền; 3) Huế giành chính quyền; 4) Bảo Đại thoái vị.", o: ["1 – 2 – 3 – 4", "2 – 3 – 1 – 4", "2 – 1 – 3 – 4", "3 – 2 – 1 – 4"], a: 1, ex: "Hà Nội 19/8; Huế 23/8; Sài Gòn 25/8; Bảo Đại thoái vị 30/8/1945." },
            { id: "b6_q29", topic: "dien_bien", lv: 3, q: "Khoảng thời gian từ khi Hà Nội giành chính quyền (19/8) đến địa phương muộn nhất (28/8) cho thấy điều gì?", o: ["Khởi nghĩa diễn ra chậm chạp, thiếu thống nhất", "Tổng khởi nghĩa diễn ra nhanh chóng, thắng lợi trong khoảng 10 ngày", "Chỉ thắng lợi ở các đô thị lớn", "Quân Nhật đã chống cự quyết liệt"], a: 1, ex: "Tổng khởi nghĩa diễn ra nhanh chóng, chỉ trong khoảng 10 ngày (19/8 – 28/8)." },

            { id: "b6_q30", topic: "nguyen_nhan", lv: 1, q: "Nguyên nhân khách quan của thắng lợi Cách mạng tháng Tám là", o: ["đường lối lãnh đạo đúng đắn của Đảng", "lực lượng Đồng minh chiến thắng phát xít, tạo thời cơ", "truyền thống yêu nước của nhân dân", "quá trình chuẩn bị lâu dài của Đảng"], a: 1, ex: "Đồng minh chiến thắng phát xít, Nhật đầu hàng đã tạo thời cơ khách quan." },
            { id: "b6_q31", topic: "nguyen_nhan", lv: 2, q: "Đâu là nguyên nhân chủ quan quyết định thắng lợi của Cách mạng tháng Tám?", o: ["Sự sụp đổ của phát xít Nhật", "Đường lối lãnh đạo đúng đắn, sáng tạo của Đảng", "Sự giúp đỡ của quân Đồng minh", "Chiến tranh lạnh bắt đầu"], a: 1, ex: "Đường lối lãnh đạo đúng đắn, sáng tạo của Đảng là nguyên nhân chủ quan quyết định." },
            { id: "b6_q32", topic: "nguyen_nhan", lv: 1, q: "Một trong những nguyên nhân chủ quan của thắng lợi Cách mạng tháng Tám là", o: ["truyền thống yêu nước, đoàn kết của nhân dân", "Nhật Bản đầu hàng Đồng minh", "Mỹ ném bom nguyên tử xuống Nhật", "Liên Xô tấn công quân Quan Đông"], a: 0, ex: "Truyền thống yêu nước, đoàn kết của nhân dân là nguyên nhân chủ quan." },
            { id: "b6_q33", topic: "nguyen_nhan", lv: 2, q: "Quá trình chuẩn bị lực lượng của Đảng trước Tổng khởi nghĩa được đánh giá là", o: ["lâu dài, chu đáo", "ngắn hạn, thiếu chuẩn bị", "chỉ diễn ra ở Hà Nội", "dựa hoàn toàn vào nước ngoài"], a: 0, ex: "Quá trình chuẩn bị lâu dài, chu đáo là một nguyên nhân chủ quan quan trọng." },
            { id: "b6_q34", topic: "nguyen_nhan", lv: 2, q: "“Thời cơ ngàn năm có một” của Cách mạng tháng Tám xuất hiện trong khoảng thời gian nào?", o: ["Từ 9/3/1945 đến 13/8/1945", "Từ khi Nhật đầu hàng (15/8/1945) đến trước khi quân Đồng minh vào Đông Dương", "Từ 19/8/1945 đến 2/9/1945", "Sau khi quân Đồng minh vào Đông Dương"], a: 1, ex: "Thời cơ là khoảng thời gian ngắn sau khi Nhật đầu hàng, trước khi quân Đồng minh vào Đông Dương." },
            { id: "b6_q35", topic: "nguyen_nhan", lv: 3, q: "Việc phát động Tổng khởi nghĩa ngay sau khi Nhật đầu hàng thể hiện điều gì?", o: ["Sự chờ đợi thời cơ của Đảng", "Sự chủ động, mau lẹ chớp thời cơ của Đảng", "Sự phụ thuộc vào quân Đồng minh", "Sự thiếu chuẩn bị về lực lượng"], a: 1, ex: "Đảng đã chủ động, mau lẹ chớp lấy thời cơ khi Nhật đầu hàng." },
            { id: "b6_q36", topic: "nguyen_nhan", lv: 3, q: "Nhận định nào đúng về nguyên nhân thắng lợi của Cách mạng tháng Tám?", o: ["Chỉ nhờ điều kiện khách quan thuận lợi", "Chủ yếu nhờ sự giúp đỡ của nước ngoài", "Kết hợp điều kiện khách quan với sự chuẩn bị và lãnh đạo chủ động của Đảng", "Do quân Nhật tự nguyện trao chính quyền cho ta"], a: 2, ex: "Thắng lợi là kết quả kết hợp giữa thời cơ khách quan và chuẩn bị, lãnh đạo chủ động của Đảng." },
            { id: "b6_q37", topic: "nguyen_nhan", lv: 2, q: "Sự kiện nào chứng tỏ Đảng đã tận dụng thời cơ để khởi nghĩa giành chính quyền?", o: ["Thành lập Mặt trận Việt Minh (1941)", "Ra Quân lệnh số 1 (13/8/1945)", "Ký Hiệp định Sơ bộ (1946)", "Thành lập Đảng Cộng sản Việt Nam (1930)"], a: 1, ex: "Quân lệnh số 1 (13/8/1945) phát động Tổng khởi nghĩa ngay khi thời cơ đến." },

            { id: "b6_q38", topic: "y_nghia", lv: 1, q: "Cách mạng tháng Tám lật đổ", o: ["ách cai trị của thực dân Pháp hơn 80 năm và của quân phiệt Nhật gần 5 năm", "chế độ phong kiến hơn 1000 năm", "ách thống trị của Mỹ ở miền Nam", "chính quyền tay sai Ngô Đình Diệm"], a: 0, ex: "Cách mạng tháng Tám lật đổ ách cai trị của thực dân Pháp hơn 80 năm và quân phiệt Nhật gần 5 năm." },
            { id: "b6_q39", topic: "y_nghia", lv: 1, q: "Cách mạng tháng Tám chấm dứt", o: ["thời kì quân chủ hơn 1000 năm", "Chiến tranh thế giới thứ hai", "ách thống trị của phát xít Đức", "chế độ thuộc địa trên toàn thế giới"], a: 0, ex: "Cách mạng tháng Tám chấm dứt thời kì quân chủ hơn 1000 năm ở Việt Nam." },
            { id: "b6_q40", topic: "y_nghia", lv: 1, q: "Thắng lợi Cách mạng tháng Tám đưa Đảng Cộng sản Đông Dương từ", o: ["đảng cầm quyền thành đảng đối lập", "đảng hoạt động bí mật trở thành đảng cầm quyền", "đảng nhỏ thành đảng lớn nhất châu Á", "đảng hoạt động công khai thành bí mật"], a: 1, ex: "Đảng từ một đảng hoạt động bí mật trở thành đảng cầm quyền." },
            { id: "b6_q41", topic: "y_nghia", lv: 1, q: "Cách mạng tháng Tám đưa nhân dân Việt Nam từ", o: ["thân phận nô lệ trở thành người làm chủ đất nước", "người lao động thành người bóc lột", "nông dân thành công nhân", "công dân thuộc địa thành công dân Pháp"], a: 0, ex: "Nhân dân từ thân phận nô lệ trở thành người làm chủ đất nước." },
            { id: "b6_q42", topic: "y_nghia", lv: 1, q: "Cách mạng tháng Tám mở ra kỉ nguyên nào của dân tộc?", o: ["Kỉ nguyên độc lập, tự do và phát triển dưới chế độ dân chủ cộng hoà", "Kỉ nguyên phong kiến độc lập", "Kỉ nguyên công nghiệp hoá", "Kỉ nguyên đấu tranh chống thực dân"], a: 0, ex: "Cách mạng tháng Tám mở ra kỉ nguyên độc lập, tự do và phát triển dưới chế độ dân chủ cộng hoà." },
            { id: "b6_q43", topic: "y_nghia", lv: 2, q: "Đối với quốc tế, Cách mạng tháng Tám", o: ["góp phần vào thắng lợi của lực lượng hoà bình, dân chủ, tiến bộ; làm tan rã hệ thống thuộc địa", "là thắng lợi đầu tiên của phong trào cộng sản thế giới", "mở đầu Chiến tranh lạnh", "thay đổi Trật tự hai cực I-an-ta"], a: 0, ex: "Cách mạng tháng Tám góp phần vào thắng lợi chung của lực lượng hoà bình, dân chủ, tiến bộ chống phát xít." },

            { id: "b6_q44", topic: "bai_hoc", lv: 2, q: "Bài học về sự lãnh đạo của Đảng được rút ra từ Cách mạng tháng Tám là", o: ["Đảng phải có đường lối đúng đắn trên cơ sở vận dụng sáng tạo Mác – Lê-nin vào thực tiễn Việt Nam", "Đảng phải nắm toàn bộ hoạt động kinh tế", "Đảng phải liên minh với các thế lực bên ngoài", "Đảng phải chờ sự giúp đỡ của quốc tế"], a: 0, ex: "Đảng phải có đường lối đúng đắn trên cơ sở vận dụng sáng tạo Mác – Lê-nin vào thực tiễn Việt Nam." },
            { id: "b6_q45", topic: "bai_hoc", lv: 2, q: "Thắng lợi Cách mạng tháng Tám gắn với vai trò của tổ chức nào trong tập hợp, đoàn kết toàn dân?", o: ["Mặt trận Việt Minh", "Quốc hội", "Hội Liên Việt", "Chính phủ lâm thời"], a: 0, ex: "Mặt trận Việt Minh có vai trò quan trọng trong tập hợp, tổ chức và đoàn kết toàn dân." },
            { id: "b6_q46", topic: "bai_hoc", lv: 3, q: "Bài học về nắm bắt thời cơ đòi hỏi", o: ["xác định đúng thời cơ, chủ động và mau lẹ hành động", "chờ thời cơ chín muồi rồi mới chuẩn bị lực lượng", "luôn hành động ngay lập tức bất kể điều kiện", "trông cậy hoàn toàn vào tình hình quốc tế"], a: 0, ex: "Bài học là phải xác định đúng thời cơ, chủ động và mau lẹ hành động." },
            { id: "b6_q47", topic: "bai_hoc", lv: 3, q: "Từ việc dùng nhiều hình thức tập hợp quần chúng của Mặt trận Việt Minh, bài học được rút ra là", o: ["cần có hình thức phong phú, sáng tạo để tập hợp, tổ chức quần chúng", "chỉ cần tuyên truyền trên báo chí", "chỉ dựa vào lực lượng vũ trang", "không cần tổ chức quần chúng"], a: 0, ex: "Cần có các hình thức phong phú, sáng tạo để tập hợp, tổ chức quần chúng, khơi dậy lòng yêu nước." },
            { id: "b6_q48", topic: "bai_hoc", lv: 3, q: "Nhận định nào phù hợp nhất với Cách mạng tháng Tám năm 1945?", o: ["Là sự kiện lịch sử vĩ đại, mở ra bước ngoặt mới cho dân tộc", "Là cuộc đấu tranh chỉ có ý nghĩa trong nước", "Chỉ là thắng lợi quân sự", "Là kết quả của sự can thiệp nước ngoài"], a: 0, ex: "Cách mạng tháng Tám là sự kiện lịch sử vĩ đại, mở ra bước ngoặt mới cho dân tộc." }
        ],

        tf: [
            {
                id: "b6_tf01", topic: "boi_canh",
                lead: "Đọc thông tin sau: Tháng 8/1945, Chiến tranh thế giới thứ hai bước vào giai đoạn kết thúc. Ngày 6/8/1945, Mỹ ném bom nguyên tử xuống Hi-rô-si-ma; ngày 9/8/1945, Mỹ ném bom Na-ga-xa-ki và quân đội Xô viết tấn công đạo quân Quan Đông của Nhật ở Đông Bắc Trung Quốc.",
                s: [
                    { t: "Ngày 15/8/1945, Nhật Bản tuyên bố đầu hàng Đồng minh không điều kiện.", ok: true, ex: "Đúng: đúng như thông tin thời sự tháng 8/1945." },
                    { t: "Ngày 6/8/1945, Mỹ ném bom nguyên tử xuống Na-ga-xa-ki.", ok: false, ex: "Sai: ngày 6/8 là Hi-rô-si-ma, Na-ga-xa-ki là ngày 9/8." },
                    { t: "Quân đội Xô viết tấn công đạo quân Quan Đông của Nhật ở Đông Bắc Trung Quốc.", ok: true, ex: "Đúng: sự kiện diễn ra ngày 9/8/1945." },
                    { t: "Việc Nhật đầu hàng đã tạo điều kiện khách quan thuận lợi cho Tổng khởi nghĩa.", ok: true, ex: "Đúng: đây là điều kiện khách quan có lợi cho Tổng khởi nghĩa." }
                ]
            },
            {
                id: "b6_tf02", topic: "chuan_bi",
                lead: "Đọc thông tin sau: Ngày 13/8/1945, Trung ương Đảng và Tổng bộ Việt Minh thành lập Ủy ban khởi nghĩa toàn quốc, ra Quân lệnh số 1. Hội nghị toàn quốc của Đảng họp tại Tân Trào (Tuyên Quang) trong hai ngày 14–15/8/1945.",
                s: [
                    { t: "Quân lệnh số 1 chính thức phát động Tổng khởi nghĩa trong cả nước.", ok: true, ex: "Đúng: Quân lệnh số 1 do Ủy ban khởi nghĩa toàn quốc ban hành." },
                    { t: "Hội nghị toàn quốc của Đảng (14–15/8/1945) họp tại Hà Nội.", ok: false, ex: "Sai: hội nghị họp tại Tân Trào (Tuyên Quang)." },
                    { t: "Hội nghị toàn quốc quyết định những vấn đề đối nội, đối ngoại sau khi giành chính quyền.", ok: true, ex: "Đúng: hội nghị thông qua kế hoạch Tổng khởi nghĩa và các vấn đề đối nội, đối ngoại." },
                    { t: "Đại hội quốc dân diễn ra trước Hội nghị toàn quốc của Đảng.", ok: false, ex: "Sai: Đại hội quốc dân diễn ra 16–17/8, sau Hội nghị toàn quốc 14–15/8." }
                ]
            },
            {
                id: "b6_tf03", topic: "chuan_bi",
                lead: "Đọc thông tin sau: Đại hội quốc dân họp tại Tân Trào trong hai ngày 16–17/8/1945, tán thành chủ trương Tổng khởi nghĩa, thông qua 10 chính sách của Việt Minh và cử ra Ủy ban Dân tộc giải phóng Việt Nam.",
                s: [
                    { t: "Đại hội quốc dân thông qua 10 chính sách của Việt Minh.", ok: true, ex: "Đúng: đây là một nội dung quan trọng của Đại hội." },
                    { t: "Đại hội cử ra Ủy ban Dân tộc giải phóng Việt Nam do Tôn Đức Thắng làm Chủ tịch.", ok: false, ex: "Sai: Chủ tịch là Hồ Chí Minh." },
                    { t: "Ủy ban Dân tộc giải phóng Việt Nam do Hồ Chí Minh làm Chủ tịch.", ok: true, ex: "Đúng: Hồ Chí Minh được cử làm Chủ tịch." },
                    { t: "Đại hội quốc dân họp tại Chiêm Hoá (Tuyên Quang).", ok: false, ex: "Sai: Đại hội họp tại Tân Trào (Tuyên Quang)." }
                ]
            },
            {
                id: "b6_tf04", topic: "dien_bien",
                lead: "Đọc thông tin sau: Từ ngày 14/8/1945, các cấp bộ Đảng và Việt Minh ở nhiều địa phương đã căn cứ tình hình cụ thể để phát động nhân dân khởi nghĩa. Tổng khởi nghĩa nhanh chóng lan rộng cả nước.",
                s: [
                    { t: "Khởi nghĩa giành chính quyền ở Hà Nội thắng lợi ngày 19/8/1945.", ok: true, ex: "Đúng: 19/8/1945 là mốc thắng lợi ở Hà Nội." },
                    { t: "Ngày 23/8/1945, nhân dân giành chính quyền ở Huế.", ok: true, ex: "Đúng: 23/8 giành chính quyền ở Huế." },
                    { t: "Ngày 25/8/1945, nhân dân giành chính quyền ở Sài Gòn.", ok: true, ex: "Đúng: 25/8 giành chính quyền ở Sài Gòn." },
                    { t: "Địa phương giành chính quyền muộn nhất là Hà Nội (28/8/1945).", ok: false, ex: "Sai: muộn nhất là Đồng Nai Thượng và Hà Tiên (28/8)." }
                ]
            },
            {
                id: "b6_tf05", topic: "dien_bien",
                lead: "Đọc thông tin sau: Chiều 30/8/1945, vua Bảo Đại tuyên bố thoái vị. Ngày 2/9/1945, tại Quảng trường Ba Đình (Hà Nội), Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập.",
                s: [
                    { t: "Vua Bảo Đại thoái vị ngày 25/8/1945.", ok: false, ex: "Sai: Bảo Đại thoái vị chiều 30/8/1945." },
                    { t: "Việc Bảo Đại thoái vị đánh dấu chế độ phong kiến Việt Nam sụp đổ hoàn toàn.", ok: true, ex: "Đúng: sự kiện này chấm dứt chế độ phong kiến." },
                    { t: "Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hoà.", ok: true, ex: "Đúng: Tuyên ngôn khai sinh nước Việt Nam Dân chủ Cộng hoà." },
                    { t: "Tuyên ngôn Độc lập được đọc tại Quảng trường Ba Đình (Hà Nội).", ok: true, ex: "Đúng: địa điểm là Quảng trường Ba Đình." }
                ]
            },
            {
                id: "b6_tf06", topic: "nguyen_nhan",
                lead: "Đọc thông tin sau: Cách mạng tháng Tám năm 1945 thành công do nhiều nguyên nhân khách quan và chủ quan khác nhau.",
                s: [
                    { t: "Lực lượng Đồng minh chiến thắng phát xít tạo thời cơ khách quan cho Tổng khởi nghĩa.", ok: true, ex: "Đúng: đây là nguyên nhân khách quan." },
                    { t: "Đường lối lãnh đạo đúng đắn, sáng tạo của Đảng là nguyên nhân chủ quan.", ok: true, ex: "Đúng: nguyên nhân chủ quan quan trọng nhất." },
                    { t: "Truyền thống yêu nước, đoàn kết của nhân dân là nguyên nhân chủ quan.", ok: true, ex: "Đúng: truyền thống yêu nước, đoàn kết là nguyên nhân chủ quan." },
                    { t: "Thắng lợi chủ yếu nhờ sự can thiệp trực tiếp của quân Đồng minh vào Việt Nam.", ok: false, ex: "Sai: Đồng minh chưa vào Đông Dương khi khởi nghĩa nổ ra." }
                ]
            },
            {
                id: "b6_tf07", topic: "nguyen_nhan",
                lead: "Đọc thông tin sau: Khi Nhật tuyên bố đầu hàng Đồng minh, quân Nhật ở Đông Dương và chính phủ Trần Trọng Kim hoang mang; điều kiện khách quan có lợi cho Tổng khởi nghĩa đã đến.",
                s: [
                    { t: "Thời cơ Tổng khởi nghĩa xuất hiện sau khi Nhật đầu hàng Đồng minh.", ok: true, ex: "Đúng: Nhật đầu hàng tạo thời cơ." },
                    { t: "Thời cơ xuất hiện sau khi quân Đồng minh đã vào Đông Dương.", ok: false, ex: "Sai: thời cơ xuất hiện trước khi quân Đồng minh vào." },
                    { t: "Đảng đã chủ động, mau lẹ phát động Tổng khởi nghĩa khi thời cơ đến.", ok: true, ex: "Đúng: Quân lệnh số 1 ngày 13/8/1945." },
                    { t: "Tổng khởi nghĩa diễn ra trong khoảng thời gian từ 14/8 đến 28/8/1945.", ok: true, ex: "Đúng: khởi nghĩa lan rộng và thắng lợi trong khoảng thời gian này." }
                ]
            },
            {
                id: "b6_tf08", topic: "y_nghia",
                lead: "Đọc thông tin sau: Với thắng lợi của Cách mạng tháng Tám, Đảng Cộng sản Đông Dương từ một đảng hoạt động bí mật trở thành đảng cầm quyền; nhân dân Việt Nam từ thân phận nô lệ trở thành người làm chủ đất nước.",
                s: [
                    { t: "Cách mạng tháng Tám chấm dứt thời kì quân chủ hơn 1000 năm ở Việt Nam.", ok: true, ex: "Đúng: chế độ quân chủ bị xoá bỏ." },
                    { t: "Cách mạng tháng Tám lật đổ ách cai trị của thực dân Pháp hơn 80 năm.", ok: true, ex: "Đúng: ách cai trị của Pháp bị lật đổ." },
                    { t: "Sau Cách mạng tháng Tám, Đảng rút vào hoạt động bí mật.", ok: false, ex: "Sai: Đảng từ hoạt động bí mật trở thành đảng cầm quyền." },
                    { t: "Cách mạng tháng Tám mở ra kỉ nguyên độc lập, tự do và phát triển dưới chế độ dân chủ cộng hoà.", ok: true, ex: "Đúng: đây là ý nghĩa trọng đại với dân tộc." }
                ]
            },
            {
                id: "b6_tf09", topic: "y_nghia",
                lead: "Đọc thông tin sau: Cách mạng tháng Tám góp phần vào thắng lợi của các lực lượng hoà bình, dân chủ, tiến bộ trong cuộc đấu tranh chống phát xít.",
                s: [
                    { t: "Cách mạng tháng Tám góp phần làm tan rã hệ thống thuộc địa của chủ nghĩa thực dân.", ok: true, ex: "Đúng: đây là ý nghĩa quốc tế của Cách mạng tháng Tám." },
                    { t: "Cách mạng tháng Tám cổ vũ tinh thần đấu tranh của nhân dân các dân tộc thuộc địa và phụ thuộc.", ok: true, ex: "Đúng: thắng lợi cổ vũ phong trào giải phóng dân tộc." },
                    { t: "Cách mạng tháng Tám là thắng lợi đầu tiên của phong trào cộng sản và công nhân quốc tế.", ok: false, ex: "Sai: trước đó đã có Cách mạng tháng Mười Nga năm 1917." },
                    { t: "Cách mạng tháng Tám góp phần vào thắng lợi chung của phe Đồng minh chống phát xít.", ok: true, ex: "Đúng: góp phần vào thắng lợi của lực lượng hoà bình, dân chủ, tiến bộ." }
                ]
            },
            {
                id: "b6_tf10", topic: "bai_hoc",
                lead: "Đọc thông tin sau: Cách mạng tháng Tám để lại nhiều bài học quý báu về sự lãnh đạo của Đảng, về đại đoàn kết dân tộc và về nắm bắt thời cơ.",
                s: [
                    { t: "Đảng là nhân tố quyết định đối với thắng lợi của sự nghiệp cách mạng.", ok: true, ex: "Đúng: đây là bài học về sự lãnh đạo của Đảng." },
                    { t: "Cần có hình thức phong phú, sáng tạo để tập hợp, tổ chức quần chúng.", ok: true, ex: "Đúng: bài học về đại đoàn kết dân tộc." },
                    { t: "Bài học về nắm bắt thời cơ đòi hỏi chủ động và mau lẹ hành động.", ok: true, ex: "Đúng: phải xác định đúng thời cơ và chớp thời cơ." },
                    { t: "Thắng lợi của Cách mạng tháng Tám chứng tỏ không cần chuẩn bị lực lượng từ trước.", ok: false, ex: "Sai: quá trình chuẩn bị lâu dài, chu đáo là nguyên nhân quan trọng." }
                ]
            },
            {
                id: "b6_tf11", topic: "dien_bien",
                lead: "Đọc thông tin sau: Ngày 18/8/1945, Bắc Giang, Hải Dương, Hà Tĩnh, Quảng Nam giành chính quyền ở tỉnh lị sớm nhất trong cả nước.",
                s: [
                    { t: "Bốn tỉnh giành chính quyền sớm nhất gồm Bắc Giang, Hải Dương, Hà Tĩnh, Quảng Nam.", ok: true, ex: "Đúng: đúng như thông tin." },
                    { t: "Các tỉnh phía Nam giành chính quyền trước các tỉnh phía Bắc.", ok: false, ex: "Sai: Hà Nội (19/8) và các tỉnh phía Bắc giành chính quyền trước Sài Gòn (25/8)." },
                    { t: "Thắng lợi ở Hà Nội (19/8/1945) có ý nghĩa quyết định đối với thắng lợi trong cả nước.", ok: true, ex: "Đúng: thắng lợi ở Hà Nội có tác dụng quyết định đến toàn quốc." },
                    { t: "Đồng Nai Thượng và Hà Tiên giành chính quyền muộn nhất (28/8/1945).", ok: true, ex: "Đúng: đây là hai địa phương muộn nhất." }
                ]
            },
            {
                id: "b6_tf12", topic: "dien_bien",
                lead: "Đọc thông tin sau: Tổng khởi nghĩa tháng Tám diễn ra và giành thắng lợi nhanh chóng trong cả nước, đưa tới sự ra đời của nước Việt Nam Dân chủ Cộng hoà.",
                s: [
                    { t: "Tổng khởi nghĩa giành chính quyền thắng lợi ở Hà Nội, Huế, Sài Gòn trong tháng 8/1945.", ok: true, ex: "Đúng: lần lượt 19/8, 23/8, 25/8." },
                    { t: "Khởi nghĩa chỉ diễn ra ở các thành phố lớn.", ok: false, ex: "Sai: khởi nghĩa diễn ra ở cả thành thị và nông thôn trong cả nước." },
                    { t: "Ngày 2/9/1945, nước Việt Nam Dân chủ Cộng hoà ra đời.", ok: true, ex: "Đúng: Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hoà." },
                    { t: "Tổng khởi nghĩa thắng lợi nhờ kết hợp chuẩn bị lực lượng và chớp đúng thời cơ.", ok: true, ex: "Đúng: đây là nguyên nhân quan trọng của thắng lợi." }
                ]
            }
        ]
    },

    /* =================================================================
       BÀI 7 — CUỘC KHÁNG CHIẾN CHỐNG THỰC DÂN PHÁP (1945 – 1954)
       ================================================================= */
    bai_7: {
        id: "bai_7",
        title: "Bài 7: Cuộc kháng chiến chống thực dân Pháp (1945 – 1954)",
        short: "Bài 7",
        topics: {
            boi_canh: "Bối cảnh lịch sử",
            nam_bo: "Kháng chiến ở Nam Bộ",
            toan_quoc: "Toàn quốc kháng chiến",
            chien_dich: "Các chiến dịch 1946 – 1950",
            phat_trien: "Kháng chiến 1951 – 1953",
            dong_xuan: "Na-va & Đông – Xuân 1953 – 1954",
            dien_bien_phu: "Điện Biên Phủ & Giơ-ne-vơ",
            ket_qua: "Nguyên nhân, ý nghĩa"
        },
        mcq: [
            { id: "b7_q01", topic: "boi_canh", lv: 1, q: "Sau Chiến tranh thế giới thứ hai, tình hình thế giới có đặc điểm nào tác động đến Việt Nam?", o: ["Hệ thống xã hội chủ nghĩa đang hình thành", "Chiến tranh thế giới thứ ba bùng nổ", "Chủ nghĩa thực dân đã bị xoá bỏ hoàn toàn", "Mỹ và Liên Xô hợp tác toàn diện"], a: 0, ex: "Hệ thống xã hội chủ nghĩa đang hình thành là đặc điểm nổi bật của thế giới sau Chiến tranh thế giới thứ hai." },
            { id: "b7_q02", topic: "boi_canh", lv: 2, q: "Sự hình thành Trật tự hai cực I-an-ta và tình trạng Chiến tranh lạnh tác động đến Việt Nam như thế nào?", o: ["Tạo điều kiện cho Pháp trở lại xâm lược", "Tạo môi trường hoà bình tuyệt đối", "Làm Việt Nam thoát khỏi ảnh hưởng quốc tế", "Không có tác động đến Việt Nam"], a: 0, ex: "Trật tự hai cực và Chiến tranh lạnh tác động, tạo điều kiện cho Pháp trở lại xâm lược Việt Nam." },
            { id: "b7_q03", topic: "boi_canh", lv: 1, q: "Thuận lợi cơ bản của nước ta sau Cách mạng tháng Tám là", o: ["nhân dân đã giành quyền làm chủ, đồng lòng ủng hộ cách mạng", "được Mỹ viện trợ kinh tế", "quân Đồng minh bảo vệ toàn quốc", "kinh tế đã phục hồi hoàn toàn"], a: 0, ex: "Nhân dân giành quyền làm chủ, bước đầu hưởng quyền lợi nên đồng lòng ủng hộ cách mạng." },
            { id: "b7_q04", topic: "boi_canh", lv: 1, q: "Quân đội các nước đế quốc dưới danh nghĩa Đồng minh kéo vào Việt Nam sau năm 1945 đã tạo ra khó khăn gì?", o: ["Nạn đói", "Ngoại xâm và nội phản", "Thiếu hiến pháp", "Thiếu Chính phủ"], a: 1, ex: "Quân Đồng minh kéo vào cùng các thế lực phản động, 6 vạn quân Nhật tạo ra khó khăn về ngoại xâm và nội phản." },
            { id: "b7_q05", topic: "boi_canh", lv: 1, q: "Sau Cách mạng tháng Tám, nền kinh tế nước ta", o: ["nghèo nàn, lạc hậu, lại bị chiến tranh tàn phá", "đã hoàn thành công nghiệp hoá", "phát triển mạnh nhờ viện trợ", "ổn định và tăng trưởng cao"], a: 0, ex: "Nền kinh tế nghèo nàn, lạc hậu và bị chiến tranh tàn phá." },
            { id: "b7_q06", topic: "boi_canh", lv: 2, q: "Tình thế “ngàn cân treo sợi tóc” của nước Việt Nam Dân chủ Cộng hoà sau 2/9/1945 phản ánh", o: ["những khó khăn chồng chất về ngoại xâm, kinh tế và chính quyền non trẻ", "sự phát triển nhanh chóng của cách mạng", "những thuận lợi từ tình hình quốc tế", "sự ổn định chính trị đã đạt được"], a: 0, ex: "Đất nước đứng trước muôn vàn khó khăn, được ví như “ngàn cân treo sợi tóc”." },

            { id: "b7_q07", topic: "nam_bo", lv: 1, q: "Ngày 2/9/1945, thực dân Pháp có hành động gì ở Sài Gòn?", o: ["Xả súng vào đồng bào Sài Gòn – Chợ Lớn", "Ký hiệp định với Việt Nam", "Rút quân khỏi Nam Bộ", "Tấn công Hà Nội"], a: 0, ex: "Ngày 2/9/1945, Pháp xả súng ở Sài Gòn – Chợ Lớn." },
            { id: "b7_q08", topic: "nam_bo", lv: 1, q: "Ngày 23/9/1945, thực dân Pháp đánh úp trụ sở cơ quan nào?", o: ["Ủy ban hành chính Nam Bộ", "Phủ Chủ tịch", "Bộ Quốc phòng", "Tòa án nhân dân"], a: 0, ex: "Pháp đánh úp trụ sở Ủy ban hành chính Nam Bộ và cơ quan tự vệ thành phố Sài Gòn." },
            { id: "b7_q09", topic: "nam_bo", lv: 2, q: "Sự kiện ngày 23/9/1945 đánh dấu điều gì?", o: ["Mở đầu cuộc chiến tranh xâm lược Việt Nam lần thứ hai của thực dân Pháp", "Kết thúc kháng chiến ở Nam Bộ", "Pháp công nhận độc lập của Việt Nam", "Hiệp định Giơ-ne-vơ được ký kết"], a: 0, ex: "23/9/1945 mở đầu cuộc chiến tranh xâm lược Việt Nam lần thứ hai của thực dân Pháp." },
            { id: "b7_q10", topic: "nam_bo", lv: 1, q: "Ngày 23/9/1945, tổ chức nào được thành lập?", o: ["Ủy ban kháng chiến Nam Bộ", "Ủy ban Dân tộc giải phóng", "Chính phủ lâm thời", "Mặt trận Liên Việt"], a: 0, ex: "Ngày 23/9/1945, Ủy ban kháng chiến Nam Bộ được thành lập." },
            { id: "b7_q11", topic: "nam_bo", lv: 1, q: "Đảng và Chính phủ đã làm gì để chi viện cho Nam Bộ?", o: ["Huy động cả nước chi viện, thành lập các đơn vị Nam tiến", "Kêu gọi quốc tế can thiệp", "Rút lực lượng về Bắc", "Ký hiệp định với Pháp"], a: 0, ex: "Đảng và Chính phủ huy động cả nước chi viện; các đơn vị Nam tiến khẩn trương lên đường." },
            { id: "b7_q12", topic: "nam_bo", lv: 2, q: "Cuộc kháng chiến của nhân dân Nam Bộ cuối năm 1945 có ý nghĩa gì?", o: ["Bước đầu làm thất bại âm mưu “đánh nhanh, thắng nhanh” của Pháp", "Giải phóng hoàn toàn Nam Bộ", "Kết thúc chiến tranh xâm lược", "Buộc Pháp rút quân khỏi Đông Dương"], a: 0, ex: "Kháng chiến Nam Bộ bước đầu làm thất bại âm mưu “đánh nhanh, thắng nhanh” của thực dân Pháp." },

            { id: "b7_q13", topic: "toan_quoc", lv: 1, q: "Hiệp ước Hoa – Pháp được ký ngày nào?", o: ["28/2/1946", "6/3/1946", "14/9/1946", "19/12/1946"], a: 0, ex: "Hiệp ước Hoa – Pháp được ký ngày 28/2/1946." },
            { id: "b7_q14", topic: "toan_quoc", lv: 1, q: "Chủ tịch Hồ Chí Minh ký với Pháp Hiệp định Sơ bộ ngày nào?", o: ["28/2/1946", "6/3/1946", "14/9/1946", "18/12/1946"], a: 1, ex: "Hiệp định Sơ bộ được ký ngày 6/3/1946." },
            { id: "b7_q15", topic: "toan_quoc", lv: 1, q: "Tạm ước Việt – Pháp được ký ngày nào?", o: ["6/3/1946", "14/9/1946", "28/2/1946", "19/12/1946"], a: 1, ex: "Tạm ước được ký ngày 14/9/1946." },
            { id: "b7_q16", topic: "toan_quoc", lv: 1, q: "Ngày 18/12/1946, Pháp gửi tối hậu thư đòi ta", o: ["giải tán lực lượng tự vệ chiến đấu, để Pháp giữ gìn trật tự ở Hà Nội", "giao nộp vũ khí cho quân Đồng minh", "rút khỏi Hà Nội trong 24 giờ", "ký hiệp định mới với Pháp"], a: 0, ex: "Tối hậu thư đòi ta giải tán lực lượng tự vệ chiến đấu để Pháp giữ gìn trật tự ở Hà Nội." },
            { id: "b7_q17", topic: "toan_quoc", lv: 1, q: "Hồ Chí Minh ra Lời kêu gọi toàn quốc kháng chiến vào ngày nào?", o: ["19/12/1946", "18/12/1946", "23/9/1945", "28/2/1946"], a: 0, ex: "Ngày 19/12/1946, Hồ Chí Minh ra Lời kêu gọi toàn quốc kháng chiến." },
            { id: "b7_q18", topic: "toan_quoc", lv: 1, q: "Đường lối kháng chiến của ta trong giai đoạn 1946–1954 là", o: ["toàn dân, toàn diện, trường kì, tự lực cánh sinh, tranh thủ sự ủng hộ của quốc tế", "đánh nhanh, thắng nhanh", "chỉ dựa vào viện trợ của nước ngoài", "phòng thủ thụ động trong đô thị"], a: 0, ex: "Đường lối kháng chiến: toàn dân, toàn diện, trường kì, tự lực cánh sinh, tranh thủ sự ủng hộ của quốc tế." },
            { id: "b7_q19", topic: "toan_quoc", lv: 2, q: "Việc ký Hiệp định Sơ bộ (6/3/1946) và Tạm ước (14/9/1946) thể hiện", o: ["thiện chí hoà bình của Chính phủ Việt Nam", "sự nhượng bộ hoàn toàn trước Pháp", "sự thiếu quyết tâm kháng chiến", "sự phụ thuộc vào Pháp"], a: 0, ex: "Hai văn kiện thể hiện rõ thiện chí hoà bình của Chính phủ Việt Nam." },
            { id: "b7_q20", topic: "toan_quoc", lv: 3, q: "Việc đàm phán, ký kết với Pháp trước ngày 19/12/1946 nhằm mục đích gì?", o: ["Tranh thủ thời gian hoà bình để chuẩn bị lực lượng", "Đầu hàng Pháp để tránh chiến tranh", "Chờ quân Đồng minh can thiệp", "Thực hiện hiệp ước với Trung Hoa Dân Quốc"], a: 0, ex: "Mục đích là tranh thủ thời gian hoà bình, chuẩn bị lực lượng cho kháng chiến lâu dài." },

            { id: "b7_q21", topic: "chien_dich", lv: 1, q: "Cuộc chiến đấu ở các đô thị phía Bắc vĩ tuyến 16 diễn ra trong khoảng thời gian", o: ["19/12/1946 – 17/2/1947", "23/9/1945 – 6/3/1946", "7/10/1947 – 19/12/1947", "16/9/1950 – 17/10/1950"], a: 0, ex: "Cuộc chiến đấu diễn ra từ 19/12/1946 đến 17/2/1947." },
            { id: "b7_q22", topic: "chien_dich", lv: 1, q: "Tại Hà Nội, cuộc chiến đấu cuối năm 1946 diễn ra quyết liệt ở", o: ["Bắc Bộ phủ, chợ Đồng Xuân, nhà Bưu điện", "Dinh Độc Lập, chợ Bến Thành", "Ngọ Môn, chùa Thiên Mụ", "phố Hiến, đền Hùng"], a: 0, ex: "Các điểm chiến đấu quyết liệt: Bắc Bộ phủ, chợ Đồng Xuân, nhà Bưu điện…" },
            { id: "b7_q23", topic: "chien_dich", lv: 1, q: "Kết quả của cuộc chiến đấu ở các đô thị phía Bắc vĩ tuyến 16 là", o: ["giam chân Pháp, bộ đội chủ lực rút lên căn cứ an toàn", "giải phóng Hà Nội", "tiêu diệt toàn bộ quân Pháp", "buộc Pháp rút khỏi miền Bắc"], a: 0, ex: "Ta giam chân Pháp ở các thành phố, bộ đội chủ lực chủ động rút lui an toàn." },
            { id: "b7_q24", topic: "chien_dich", lv: 2, q: "Ý nghĩa của cuộc chiến đấu ở các đô thị phía Bắc vĩ tuyến 16 là", o: ["làm thất bại một bước kế hoạch “đánh nhanh thắng nhanh” của Pháp", "kết thúc chiến tranh", "mở ra chiến dịch Điện Biên Phủ", "buộc Pháp ký Hiệp định Giơ-ne-vơ"], a: 0, ex: "Cuộc chiến đấu làm thất bại một bước kế hoạch “đánh nhanh thắng nhanh” của Pháp." },
            { id: "b7_q25", topic: "chien_dich", lv: 1, q: "Trong chiến dịch Việt Bắc thu – đông 1947, quân ta đã", o: ["chủ động bao vây, tiến công, đẩy lùi quân Pháp khỏi một số vị trí quan trọng", "rút khỏi Việt Bắc", "đánh chiếm Hà Nội", "mở đường sang Trung Quốc"], a: 0, ex: "Ta chủ động bao vây, tiến công ở Chợ Đồn, Chợ Rã, Đoan Hùng…" },
            { id: "b7_q26", topic: "chien_dich", lv: 2, q: "Chiến dịch Việt Bắc thu – đông 1947 có ý nghĩa", o: ["là chiến dịch phản công lớn đầu tiên, làm phá sản hoàn toàn kế hoạch “đánh nhanh, thắng nhanh”", "là chiến dịch tiến công lớn đầu tiên", "kết thúc cuộc kháng chiến", "giải phóng vùng biên giới"], a: 0, ex: "Đây là chiến dịch phản công lớn đầu tiên, phá sản hoàn toàn kế hoạch “đánh nhanh, thắng nhanh”." },
            { id: "b7_q27", topic: "chien_dich", lv: 1, q: "Trong chiến dịch Biên giới thu – đông 1950, quân ta mở màn bằng việc tấn công cứ điểm nào?", o: ["Đông Khê", "Him Lam", "Bản Kéo", "Mường Thanh"], a: 0, ex: "Quân ta tấn công Đông Khê, mai phục, chặn đánh quân Pháp trên Đường số 4." },
            { id: "b7_q28", topic: "chien_dich", lv: 1, q: "Kết quả của chiến dịch Biên giới thu – đông 1950 là", o: ["giải phóng vùng biên giới rộng lớn, mở đường liên lạc quốc tế, chọc thủng Hành lang Đông – Tây", "giải phóng Hà Nội", "tiêu diệt tập đoàn cứ điểm Điện Biên Phủ", "buộc Pháp rút khỏi Đông Dương"], a: 0, ex: "Chiến dịch giải phóng biên giới, mở đường liên lạc quốc tế, chọc thủng Hành lang Đông – Tây." },
            { id: "b7_q29", topic: "chien_dich", lv: 1, q: "Chiến dịch Biên giới thu – đông 1950 đã làm phá sản kế hoạch quân sự nào của Pháp?", o: ["Kế hoạch Rơ-ve", "Kế hoạch Na-va", "Kế hoạch Đờ Lát đơ Tát-xi-nhi", "Kế hoạch Xta-lây – Tay-lo"], a: 0, ex: "Chiến dịch Biên giới làm phá sản Kế hoạch Rơ-ve của Pháp." },
            { id: "b7_q30", topic: "chien_dich", lv: 3, q: "Chiến dịch nào đã giành được thế chủ động trên chiến trường chính Bắc Bộ?", o: ["Việt Bắc thu – đông 1947", "Biên giới thu – đông 1950", "Điện Biên Phủ 1954", "Thượng Lào 1953"], a: 1, ex: "Sau chiến dịch Biên giới 1950, ta giành thế chủ động trên chiến trường chính Bắc Bộ." },

            { id: "b7_q31", topic: "phat_trien", lv: 1, q: "Đại hội đại biểu toàn quốc lần thứ II của Đảng (2/1951) họp tại", o: ["Chiêm Hoá (Tuyên Quang)", "Tân Trào (Tuyên Quang)", "Hà Nội", "Cao Bằng"], a: 0, ex: "Đại hội II họp tại Chiêm Hoá (Tuyên Quang) tháng 2/1951." },
            { id: "b7_q32", topic: "phat_trien", lv: 1, q: "Đại hội II (2/1951) quyết định tách Đảng Cộng sản Đông Dương để", o: ["thành lập ở mỗi nước một Đảng Mác – Lê-nin riêng", "thành lập một đảng mới ở Lào", "giải tán Đảng", "sáp nhập với Đảng Cộng sản Trung Quốc"], a: 0, ex: "Đại hội quyết định tách Đảng để thành lập ở mỗi nước một Đảng Mác – Lê-nin riêng." },
            { id: "b7_q33", topic: "phat_trien", lv: 1, q: "Tại Việt Nam, Đảng ra hoạt động công khai với tên mới là", o: ["Đảng Lao động Việt Nam", "Đảng Cộng sản Việt Nam", "Việt Nam Quốc dân đảng", "Đảng Dân chủ Việt Nam"], a: 0, ex: "Đảng ra hoạt động công khai với tên Đảng Lao động Việt Nam." },
            { id: "b7_q34", topic: "phat_trien", lv: 1, q: "Tháng 3/1951, Mặt trận Việt Minh hợp nhất với tổ chức nào thành Mặt trận Liên Việt?", o: ["Hội Liên Việt", "Mặt trận Dân tộc giải phóng", "Liên minh nhân dân Việt – Miên – Lào", "Tổng bộ Việt Minh"], a: 0, ex: "Mặt trận Việt Minh và Hội Liên Việt hợp nhất thành Mặt trận Liên Việt." },
            { id: "b7_q35", topic: "phat_trien", lv: 1, q: "Liên minh nhân dân Việt – Miên – Lào được thành lập vào thời gian nào?", o: ["Tháng 3/1951", "Tháng 2/1951", "Tháng 12/1953", "Tháng 7/1953"], a: 0, ex: "Liên minh nhân dân Việt – Miên – Lào được thành lập tháng 3/1951." },
            { id: "b7_q36", topic: "phat_trien", lv: 1, q: "Ba chiến dịch tiến công của quân đội ta từ cuối năm 1950 đến giữa năm 1951 là", o: ["Trần Hưng Đạo, Hoàng Hoa Thám, Quang Trung", "Việt Bắc, Biên giới, Hòa Bình", "Tây Bắc, Thượng Lào, Điện Biên Phủ", "Đông Khê, Cao Bằng, Lạng Sơn"], a: 0, ex: "Ba chiến dịch: Trần Hưng Đạo, Hoàng Hoa Thám, Quang Trung." },
            { id: "b7_q37", topic: "phat_trien", lv: 1, q: "Cải cách giáo dục ở vùng tự do thực hiện theo ba phương châm", o: ["phục vụ kháng chiến, phục vụ dân sinh, phục vụ sản xuất", "phục vụ kinh tế, phục vụ quốc phòng, phục vụ ngoại giao", "dân tộc, khoa học, đại chúng", "toàn dân, toàn diện, trường kì"], a: 0, ex: "Cải cách giáo dục theo 3 phương châm: phục vụ kháng chiến, dân sinh, sản xuất." },

            { id: "b7_q38", topic: "dong_xuan", lv: 1, q: "Kế hoạch Na-va được Pháp đề ra vào thời gian nào?", o: ["Tháng 7/1953", "Tháng 12/1953", "Tháng 5/1953", "Tháng 3/1954"], a: 0, ex: "Tháng 7/1953, Pháp đề ra Kế hoạch Na-va." },
            { id: "b7_q39", topic: "dong_xuan", lv: 1, q: "Mục tiêu của Kế hoạch Na-va là", o: ["giành thắng lợi quân sự quyết định trong 18 tháng để kết thúc chiến tranh trong danh dự", "giành chính quyền ở miền Bắc", "mở rộng chiến tranh sang Lào", "tiêu diệt căn cứ Việt Bắc"], a: 0, ex: "Na-va hi vọng trong 18 tháng giành thắng lợi quân sự quyết định để kết thúc chiến tranh trong danh dự." },
            { id: "b7_q40", topic: "dong_xuan", lv: 1, q: "Cuộc Tiến công chiến lược Đông – Xuân 1953 – 1954 của ta có tác dụng", o: ["phá sản bước đầu Kế hoạch Na-va, chuẩn bị cho chiến dịch Điện Biên Phủ", "kết thúc chiến tranh", "buộc Pháp ký Hiệp định Giơ-ne-vơ", "giải phóng hoàn toàn miền Bắc"], a: 0, ex: "Cuộc tiến công phá sản bước đầu Kế hoạch Na-va, chuẩn bị vật chất và tinh thần cho Điện Biên Phủ." },
            { id: "b7_q41", topic: "dong_xuan", lv: 1, q: "Tháng 12/1953, Đảng quyết định mở chiến dịch Điện Biên Phủ nhằm", o: ["tiêu diệt lực lượng địch, giải phóng Tây Bắc, tạo điều kiện giải phóng Bắc Lào", "giải phóng Hà Nội", "mở đường sang Trung Quốc", "bảo vệ căn cứ Việt Bắc"], a: 0, ex: "Mục tiêu: tiêu diệt lực lượng địch, giải phóng Tây Bắc, tạo điều kiện cho Lào giải phóng Bắc Lào." },
            { id: "b7_q42", topic: "dong_xuan", lv: 1, q: "Điện Biên Phủ có vị trí như thế nào theo đánh giá của Pháp – Mỹ?", o: ["Là vị trí chiến lược then chốt ở Đông Dương và Đông Nam Á", "Là vùng rừng núi xa xôi, ít quan trọng", "Là căn cứ hậu cần nhỏ", "Là trung tâm chính trị của Việt Nam"], a: 0, ex: "Điện Biên Phủ có vị trí chiến lược then chốt ở Đông Dương và Đông Nam Á." },

            { id: "b7_q43", topic: "dien_bien_phu", lv: 1, q: "Pháp xây dựng Điện Biên Phủ thành “pháo đài bất khả xâm phạm” với", o: ["16.200 quân, 49 cứ điểm, 3 phân khu", "10.000 quân, 30 cứ điểm, 2 phân khu", "20.000 quân, 50 cứ điểm, 4 phân khu", "16.200 quân, 3 cứ điểm, 1 phân khu"], a: 0, ex: "Điện Biên Phủ có 16.200 quân, bố trí thành 3 phân khu với 49 cứ điểm." },
            { id: "b7_q44", topic: "dien_bien_phu", lv: 1, q: "Đợt 1 của chiến dịch Điện Biên Phủ (13–17/3/1954), quân ta tiến công", o: ["Him Lam, đồi Độc Lập, bức hàng cứ điểm Bản Kéo", "phân khu Trung tâm", "sân bay Mường Thanh", "phân khu Nam"], a: 0, ex: "Đợt 1: tiến công cụm cứ điểm Him Lam và đồi Độc Lập, bức hàng Bản Kéo." },
            { id: "b7_q45", topic: "dien_bien_phu", lv: 1, q: "Đợt 2 của chiến dịch Điện Biên Phủ (30/3 – 26/4/1954), quân ta tiến công", o: ["các cứ điểm phía đông phân khu Trung tâm, kiểm soát sân bay Mường Thanh", "Him Lam và đồi Độc Lập", "phân khu Nam", "thị xã Điện Biên"], a: 0, ex: "Đợt 2: tiến công các cứ điểm phía đông phân khu Trung tâm, kiểm soát sân bay Mường Thanh." },
            { id: "b7_q46", topic: "dien_bien_phu", lv: 1, q: "Đờ Ca-xtơ-ri cùng Bộ Tham mưu Pháp đầu hàng vào thời điểm nào?", o: ["17 giờ 30 ngày 7/5/1954", "17 giờ 30 ngày 13/3/1954", "7 giờ 30 ngày 7/5/1954", "17 giờ ngày 30/4/1954"], a: 0, ex: "17 giờ 30 ngày 7/5/1954, Đờ Ca-xtơ-ri cùng toàn bộ Bộ Tham mưu Pháp đầu hàng." },
            { id: "b7_q47", topic: "dien_bien_phu", lv: 1, q: "Hiệp định Giơ-ne-vơ về chấm dứt chiến tranh, lập lại hoà bình ở Đông Dương được ký ngày", o: ["21/7/1954", "7/5/1954", "20/7/1954", "27/1/1953"], a: 0, ex: "Hiệp định Giơ-ne-vơ được ký ngày 21/7/1954." },
            { id: "b7_q48", topic: "dien_bien_phu", lv: 2, q: "Thắng lợi của chiến dịch Điện Biên Phủ đưa đến kết quả gì?", o: ["Miền Bắc hoàn toàn giải phóng, chuyển sang thời kì cách mạng xã hội chủ nghĩa", "Miền Nam hoàn toàn giải phóng", "Kết thúc ngay chiến tranh ở Đông Dương", "Pháp rút khỏi toàn bộ Đông Nam Á"], a: 0, ex: "Miền Bắc được hoàn toàn giải phóng, chuyển sang thời kì cách mạng xã hội chủ nghĩa." },

            { id: "b7_q49", topic: "ket_qua", lv: 2, q: "Nguyên nhân chủ quan hàng đầu của thắng lợi trong kháng chiến chống Pháp là", o: ["sự lãnh đạo sáng suốt của Đảng, đứng đầu là Chủ tịch Hồ Chí Minh", "sự giúp đỡ của Trung Quốc và Liên Xô", "sự ủng hộ của nhân dân Pháp", "sự phối hợp của Lào và Cam-pu-chia"], a: 0, ex: "Sự lãnh đạo sáng suốt của Đảng với đường lối kháng chiến đúng đắn, sáng tạo là nguyên nhân chủ quan hàng đầu." },
            { id: "b7_q50", topic: "ket_qua", lv: 1, q: "Một nguyên nhân khách quan của thắng lợi kháng chiến chống Pháp là", o: ["sự ủng hộ, giúp đỡ của Trung Quốc, Liên Xô và các lực lượng yêu chuộng hoà bình", "sự lãnh đạo của Đảng", "tinh thần yêu nước của nhân dân", "hậu phương miền Bắc vững chắc"], a: 0, ex: "Sự ủng hộ của Trung Quốc, Liên Xô, các nước dân chủ nhân dân và nhân dân Pháp là nguyên nhân khách quan." },
            { id: "b7_q51", topic: "ket_qua", lv: 2, q: "Nhận định nào đúng về nguyên nhân thắng lợi của kháng chiến chống Pháp?", o: ["Kết hợp sức mạnh dân tộc với sự ủng hộ quốc tế", "Chỉ nhờ sự giúp đỡ của quốc tế", "Chỉ nhờ ưu thế vũ khí", "Chủ yếu nhờ Pháp suy yếu sau Chiến tranh thế giới thứ hai"], a: 0, ex: "Thắng lợi là kết quả kết hợp sức mạnh dân tộc và sức mạnh thời đại, sự ủng hộ quốc tế." },
            { id: "b7_q52", topic: "ket_qua", lv: 1, q: "Đối với Việt Nam, thắng lợi kháng chiến chống Pháp đã", o: ["chấm dứt cuộc chiến tranh xâm lược và ách thống trị của thực dân Pháp", "kết thúc hoàn toàn chiến tranh ở Đông Dương", "thống nhất đất nước", "mở ra thời kì công nghiệp hoá"], a: 0, ex: "Thắng lợi chấm dứt chiến tranh xâm lược và ách thống trị của thực dân Pháp trên đất nước ta." },
            { id: "b7_q53", topic: "ket_qua", lv: 2, q: "Đối với thế giới, thắng lợi kháng chiến chống Pháp của nhân dân Việt Nam đã", o: ["góp phần làm tan rã hệ thống thuộc địa của chủ nghĩa đế quốc, cổ vũ phong trào giải phóng dân tộc", "chấm dứt Chiến tranh lạnh", "làm sụp đổ Trật tự hai cực I-an-ta", "mở đầu phong trào không liên kết"], a: 0, ex: "Thắng lợi góp phần làm tan rã hệ thống thuộc địa, cổ vũ phong trào giải phóng dân tộc ở châu Á, châu Phi, Mỹ La-tinh." },
            { id: "b7_q54", topic: "dien_bien_phu", lv: 3, q: "Vì sao chiến thắng Điện Biên Phủ (1954) được coi là đỉnh cao của cuộc kháng chiến chống Pháp?", o: ["Đập tan kế hoạch Na-va, tạo thế quyết định tại Hội nghị Giơ-ne-vơ", "Là trận đánh có sự tham gia trực tiếp của quân đồng minh", "Mở đầu cuộc kháng chiến toàn quốc", "Buộc Pháp rút khỏi toàn bộ Đông Nam Á"], a: 0, ex: "Điện Biên Phủ đập tan kế hoạch Na-va, tạo thế quyết định buộc Pháp phải ký Hiệp định Giơ-ne-vơ." },
            { id: "b7_q55", topic: "chien_dich", lv: 3, q: "Điểm mới nổi bật của Chiến dịch Biên giới thu – đông 1950 so với Chiến dịch Việt Bắc thu – đông 1947 là gì?", o: ["Ta chủ động mở chiến dịch tiến công, giành quyền chủ động trên chiến trường chính Bắc Bộ", "Ta chỉ phòng ngự, chống lại cuộc tiến công của Pháp", "Pháp chủ động tấn công căn cứ địa Việt Bắc", "Chiến dịch diễn ra chủ yếu ở Nam Bộ"], a: 0, ex: "Năm 1947 ta đánh bại cuộc tiến công của Pháp; đến năm 1950 ta chủ động mở chiến dịch, giành quyền chủ động trên chiến trường chính." },
            { id: "b7_q56", topic: "toan_quoc", lv: 3, q: "Đảng và Chính phủ phát động toàn quốc kháng chiến ngày 19/12/1946 xuất phát từ lí do chủ yếu nào?", o: ["Sau tối hậu thư 18/12/1946 của Pháp, khả năng hoà hoãn không còn, phải kháng chiến để giữ độc lập", "Ta đã hoàn thành chuẩn bị mọi mặt cho chiến tranh", "Ta được các nước Đồng minh đồng ý cho kháng chiến", "Ta muốn giành thế chủ động trên chiến trường Nam Bộ"], a: 0, ex: "Pháp gửi tối hậu thư đòi ta hạ vũ khí (18/12/1946), khả năng hoà hoãn đã hết, ta buộc phải kháng chiến." },
            { id: "b7_q57", topic: "dong_xuan", lv: 3, q: "Cuộc Tiến công chiến lược Đông – Xuân 1953 – 1954 đã bước đầu làm phá sản kế hoạch Na-va vì", o: ["buộc quân Pháp phải phân tán lực lượng, không thể tập trung thành khối mạnh ở đồng bằng Bắc Bộ", "đã giải phóng hoàn toàn Điện Biên Phủ", "đã buộc Pháp ký Hiệp định Giơ-ne-vơ", "đã tiêu diệt toàn bộ quân Pháp ở Đông Dương"], a: 0, ex: "Ta tiến công vào những hướng địch sơ hở, buộc Pháp phân tán lực lượng, phá bước đầu kế hoạch Na-va." }
        ],

        tf: [
            {
                id: "b7_tf01", topic: "boi_canh",
                lead: "Đọc thông tin sau: Sau Cách mạng tháng Tám, nước Việt Nam Dân chủ Cộng hoà đứng trước muôn vàn khó khăn: quân đội các nước đế quốc dưới danh nghĩa Đồng minh kéo vào, các thế lực phản động và 6 vạn quân Nhật còn ở Đông Dương; chính quyền và lực lượng vũ trang cách mạng còn non trẻ; kinh tế nghèo nàn, lạc hậu.",
                s: [
                    { t: "Nhân dân đã giành quyền làm chủ, bước đầu hưởng quyền lợi nên đồng lòng ủng hộ cách mạng.", ok: true, ex: "Đúng: đây là thuận lợi cơ bản trong nước." },
                    { t: "Nền kinh tế nước ta sau Cách mạng tháng Tám đã được công nghiệp hoá.", ok: false, ex: "Sai: kinh tế nghèo nàn, lạc hậu, bị chiến tranh tàn phá." },
                    { t: "Đất nước đứng trước tình thế “ngàn cân treo sợi tóc”.", ok: true, ex: "Đúng: tình thế khó khăn chồng chất được ví như vậy." },
                    { t: "Sự hình thành Trật tự hai cực I-an-ta và Chiến tranh lạnh có tác động đến Việt Nam.", ok: true, ex: "Đúng: bối cảnh quốc tế tác động trực tiếp đến cách mạng Việt Nam." }
                ]
            },
            {
                id: "b7_tf02", topic: "nam_bo",
                lead: "Đọc thông tin sau: Đêm 22 rạng sáng 23/9/1945, thực dân Pháp đánh úp trụ sở Ủy ban hành chính Nam Bộ và cơ quan tự vệ thành phố Sài Gòn. Ngày 23/9/1945, Ủy ban kháng chiến Nam Bộ được thành lập.",
                s: [
                    { t: "Ngày 2/9/1945, Pháp xả súng ở Sài Gòn – Chợ Lớn.", ok: true, ex: "Đúng: Pháp gây hấn ngay ngày 2/9/1945." },
                    { t: "Sự kiện 23/9/1945 mở đầu cuộc chiến tranh xâm lược Việt Nam lần thứ hai của thực dân Pháp.", ok: true, ex: "Đúng: đây là mốc mở đầu chiến tranh xâm lược lần thứ hai." },
                    { t: "Đảng và Chính phủ không chi viện cho Nam Bộ.", ok: false, ex: "Sai: Đảng và Chính phủ huy động cả nước chi viện, thành lập các đơn vị Nam tiến." },
                    { t: "Kháng chiến ở Nam Bộ bước đầu làm thất bại âm mưu “đánh nhanh, thắng nhanh” của Pháp.", ok: true, ex: "Đúng: đây là ý nghĩa của cuộc kháng chiến ở Nam Bộ cuối năm 1945." }
                ]
            },
            {
                id: "b7_tf03", topic: "toan_quoc",
                lead: "Đọc thông tin sau: Sau Hiệp ước Hoa – Pháp (28/2/1946), Chủ tịch Hồ Chí Minh ký với Pháp Hiệp định Sơ bộ (6/3/1946) và Tạm ước (14/9/1946), thể hiện rõ thiện chí hoà bình.",
                s: [
                    { t: "Hiệp định Sơ bộ được ký ngày 6/3/1946.", ok: true, ex: "Đúng: Hiệp định Sơ bộ ký 6/3/1946." },
                    { t: "Tạm ước Việt – Pháp được ký ngày 14/9/1946.", ok: true, ex: "Đúng: Tạm ước ký 14/9/1946." },
                    { t: "Việc ký kết thể hiện sự nhượng bộ hoàn toàn của ta trước Pháp.", ok: false, ex: "Sai: đó là thiện chí hoà bình, tranh thủ thời gian chuẩn bị lực lượng." },
                    { t: "Thực dân Pháp luôn tìm cách phá hoại những điều đã ký kết.", ok: true, ex: "Đúng: Pháp đẩy mạnh xâm lược cả nước ta." }
                ]
            },
            {
                id: "b7_tf04", topic: "toan_quoc",
                lead: "Đọc thông tin sau: Ngày 18/12/1946, Pháp gửi tối hậu thư đòi ta giải tán lực lượng tự vệ chiến đấu để Pháp giữ gìn trật tự ở Hà Nội. Ngày 19/12/1946, Hồ Chí Minh ra Lời kêu gọi toàn quốc kháng chiến.",
                s: [
                    { t: "Tối hậu thư của Pháp đòi ta giải tán lực lượng tự vệ chiến đấu.", ok: true, ex: "Đúng: nội dung tối hậu thư ngày 18/12/1946." },
                    { t: "Lời kêu gọi toàn quốc kháng chiến được ra ngày 19/12/1946.", ok: true, ex: "Đúng: ngày 19/12/1946." },
                    { t: "Đường lối kháng chiến của ta là đánh nhanh, thắng nhanh.", ok: false, ex: "Sai: đường lối là toàn dân, toàn diện, trường kì, tự lực cánh sinh." },
                    { t: "Đường lối kháng chiến của ta có nội dung tranh thủ sự ủng hộ của quốc tế.", ok: true, ex: "Đúng: toàn dân, toàn diện, trường kì, tự lực cánh sinh, tranh thủ ủng hộ quốc tế." }
                ]
            },
            {
                id: "b7_tf05", topic: "chien_dich",
                lead: "Đọc thông tin sau: Cuộc chiến đấu ở các đô thị phía Bắc vĩ tuyến 16 diễn ra từ 19/12/1946 đến 17/2/1947, quyết liệt nhất ở Hà Nội tại Bắc Bộ phủ, chợ Đồng Xuân, nhà Bưu điện.",
                s: [
                    { t: "Cuộc chiến đấu ở các đô thị phía Bắc vĩ tuyến 16 kéo dài đến ngày 17/2/1947.", ok: true, ex: "Đúng: từ 19/12/1946 đến 17/2/1947." },
                    { t: "Ta đã giam chân Pháp ở Hà Nội và các thành phố, bộ đội chủ lực rút lui an toàn.", ok: true, ex: "Đúng: đây là kết quả của cuộc chiến đấu." },
                    { t: "Cuộc chiến đấu đã làm phá sản hoàn toàn kế hoạch “đánh nhanh thắng nhanh” của Pháp.", ok: false, ex: "Sai: mới làm thất bại một bước; phá sản hoàn toàn là ở chiến dịch Việt Bắc 1947." },
                    { t: "Cuộc chiến đấu góp phần củng cố niềm tin của quân dân vào thắng lợi của kháng chiến.", ok: true, ex: "Đúng: đây là một ý nghĩa của cuộc chiến đấu." }
                ]
            },
            {
                id: "b7_tf06", topic: "chien_dich",
                lead: "Đọc thông tin sau: Trong chiến dịch Việt Bắc thu – đông 1947, quân ta chủ động bao vây, tiến công, đẩy lùi quân Pháp khỏi một số vị trí quan trọng như Chợ Đồn, Chợ Rã, Đoan Hùng. Quân Pháp phải rút chạy khỏi Việt Bắc.",
                s: [
                    { t: "Chiến dịch Việt Bắc thu – đông 1947 là chiến dịch phản công lớn đầu tiên của ta.", ok: true, ex: "Đúng: đây là chiến dịch phản công lớn đầu tiên." },
                    { t: "Chiến dịch đã làm phá sản hoàn toàn kế hoạch “đánh nhanh, thắng nhanh” của Pháp.", ok: true, ex: "Đúng: kế hoạch bị phá sản hoàn toàn." },
                    { t: "Cơ quan đầu não của cuộc kháng chiến không được bảo vệ an toàn.", ok: false, ex: "Sai: cơ quan đầu não được bảo vệ an toàn." },
                    { t: "Sau chiến dịch, bộ đội ta ngày càng trưởng thành.", ok: true, ex: "Đúng: đây là một kết quả của chiến dịch." }
                ]
            },
            {
                id: "b7_tf07", topic: "chien_dich",
                lead: "Đọc thông tin sau: Trong chiến dịch Biên giới thu – đông 1950, quân ta tấn công Đông Khê, mai phục và chặn đánh quân Pháp ở nhiều nơi trên Đường số 4, buộc chúng phải rút chạy.",
                s: [
                    { t: "Chiến dịch Biên giới 1950 mở màn bằng tấn công cứ điểm Đông Khê.", ok: true, ex: "Đúng: Đông Khê là trận mở màn." },
                    { t: "Chiến dịch đã phá sản Kế hoạch Rơ-ve của Pháp.", ok: true, ex: "Đúng: đây là kết quả quan trọng." },
                    { t: "Chiến dịch đã chọc thủng Hành lang Đông – Tây của Pháp.", ok: true, ex: "Đúng: Hành lang Đông – Tây bị chọc thủng." },
                    { t: "Sau chiến dịch, ta mất thế chủ động trên chiến trường chính Bắc Bộ.", ok: false, ex: "Sai: ta giành được thế chủ động trên chiến trường chính Bắc Bộ." }
                ]
            },
            {
                id: "b7_tf08", topic: "phat_trien",
                lead: "Đọc thông tin sau: Tháng 2/1951, Đại hội đại biểu toàn quốc lần thứ II của Đảng họp tại Chiêm Hoá (Tuyên Quang), quyết định tách Đảng Cộng sản Đông Dương để thành lập ở mỗi nước một Đảng Mác – Lê-nin riêng.",
                s: [
                    { t: "Đại hội II của Đảng họp tại Chiêm Hoá (Tuyên Quang) tháng 2/1951.", ok: true, ex: "Đúng: địa điểm và thời gian chính xác." },
                    { t: "Ở Việt Nam, Đảng ra hoạt động công khai với tên Đảng Lao động Việt Nam.", ok: true, ex: "Đúng: tên mới là Đảng Lao động Việt Nam." },
                    { t: "Tháng 3/1951, Mặt trận Việt Minh và Hội Liên Việt hợp nhất thành Mặt trận Liên Việt.", ok: true, ex: "Đúng: sự hợp nhất diễn ra tháng 3/1951." },
                    { t: "Đại hội II quyết định giải tán Đảng Cộng sản Đông Dương.", ok: false, ex: "Sai: tách Đảng để thành lập Đảng riêng ở mỗi nước, không giải tán." }
                ]
            },
            {
                id: "b7_tf09", topic: "phat_trien",
                lead: "Đọc thông tin sau: Trong những năm 1951–1953, cuộc kháng chiến có bước phát triển mới trên các lĩnh vực chính trị, kinh tế, văn hoá, quân sự. Năm 1952, cuộc vận động sản xuất và tiết kiệm được phát động.",
                s: [
                    { t: "Năm 1952, cuộc vận động sản xuất và tiết kiệm được phát động.", ok: true, ex: "Đúng: phong trào trở nên sôi nổi trong quần chúng." },
                    { t: "Tháng 12/1953, Quốc hội thông qua Luật Cải cách ruộng đất.", ok: true, ex: "Đúng: Quốc hội thông qua Luật Cải cách ruộng đất tháng 12/1953." },
                    { t: "Cải cách giáo dục thực hiện theo phương châm phục vụ kháng chiến, phục vụ dân sinh, phục vụ sản xuất.", ok: true, ex: "Đúng: đây là 3 phương châm cải cách giáo dục." },
                    { t: "Trong giai đoạn này, quân đội ta mất quyền chủ động trên chiến trường.", ok: false, ex: "Sai: ta tiếp tục giữ vững quyền chủ động trên chiến trường." }
                ]
            },
            {
                id: "b7_tf10", topic: "dong_xuan",
                lead: "Đọc thông tin sau: Tháng 7/1953, được sự thoả thuận của Mỹ, thực dân Pháp đề ra Kế hoạch Na-va với hi vọng trong vòng 18 tháng giành một thắng lợi quân sự quyết định để kết thúc chiến tranh trong danh dự.",
                s: [
                    { t: "Kế hoạch Na-va được Pháp đề ra tháng 7/1953.", ok: true, ex: "Đúng: tháng 7/1953." },
                    { t: "Na-va dự kiến giành thắng lợi quân sự quyết định trong vòng 18 tháng.", ok: true, ex: "Đúng: mục tiêu của Kế hoạch Na-va." },
                    { t: "Cuộc Tiến công chiến lược Đông – Xuân 1953 – 1954 đã phá sản bước đầu Kế hoạch Na-va.", ok: true, ex: "Đúng: đây là tác dụng của cuộc tiến công." },
                    { t: "Kế hoạch Na-va đã đạt được mục tiêu kết thúc chiến tranh trong danh dự.", ok: false, ex: "Sai: kế hoạch thất bại hoàn toàn tại Điện Biên Phủ." }
                ]
            },
            {
                id: "b7_tf11", topic: "dien_bien_phu",
                lead: "Đọc thông tin sau: Chiến dịch Điện Biên Phủ diễn ra qua 3 đợt. Đợt 1 từ 13 đến 17/3/1954; đợt 2 từ 30/3 đến 26/4/1954; đợt 3 từ 1 đến 7/5/1954. Đến 17 giờ 30 ngày 7/5/1954, tướng Đờ Ca-xtơ-ri cùng toàn bộ Bộ Tham mưu Pháp đầu hàng.",
                s: [
                    { t: "Đợt 1 của chiến dịch tiến công Him Lam và đồi Độc Lập, bức hàng Bản Kéo.", ok: true, ex: "Đúng: diễn ra từ 13 đến 17/3/1954." },
                    { t: "Đợt 2 quân ta kiểm soát sân bay Mường Thanh, hạn chế tiếp viện của Pháp.", ok: true, ex: "Đúng: ta tiến công các cứ điểm phía đông và kiểm soát sân bay." },
                    { t: "Chiến dịch kết thúc ngày 7/5/1954 bằng việc quân Pháp đầu hàng.", ok: true, ex: "Đúng: 17 giờ 30 ngày 7/5/1954." },
                    { t: "Hiệp định Giơ-ne-vơ được ký kết ngay trong ngày 7/5/1954.", ok: false, ex: "Sai: Hiệp định ký ngày 21/7/1954." }
                ]
            },
            {
                id: "b7_tf12", topic: "ket_qua",
                lead: "Đọc thông tin sau: Thắng lợi của cuộc kháng chiến chống thực dân Pháp đã chấm dứt cuộc chiến tranh xâm lược, đồng thời chấm dứt hoàn toàn ách thống trị của thực dân Pháp trên đất nước Việt Nam.",
                s: [
                    { t: "Thắng lợi của kháng chiến chống Pháp bảo vệ và phát triển thành quả của Cách mạng tháng Tám.", ok: true, ex: "Đúng: đây là ý nghĩa đối với Việt Nam." },
                    { t: "Sau thắng lợi, miền Bắc được giải phóng, tiến lên xây dựng chủ nghĩa xã hội.", ok: true, ex: "Đúng: miền Bắc chuyển sang thời kì xây dựng CNXH." },
                    { t: "Thắng lợi của ta không ảnh hưởng đến phong trào giải phóng dân tộc trên thế giới.", ok: false, ex: "Sai: thắng lợi cổ vũ mạnh mẽ phong trào giải phóng dân tộc." },
                    { t: "Thắng lợi góp phần làm tan rã hệ thống thuộc địa của chủ nghĩa đế quốc.", ok: true, ex: "Đúng: đây là ý nghĩa quốc tế của thắng lợi." }
                ]
            }
        ]
    },

    /* =================================================================
       BÀI 8 — CUỘC KHÁNG CHIẾN CHỐNG MỸ, CỨU NƯỚC (1954 – 1975)
       ================================================================= */
    bai_8: {
        id: "bai_8",
        title: "Bài 8: Cuộc kháng chiến chống Mỹ, cứu nước (1954 – 1975)",
        short: "Bài 8",
        topics: {
            boi_canh: "Bối cảnh lịch sử",
            giai_doan_1: "1954 – 1960",
            giai_doan_2: "1961 – 1965",
            giai_doan_3: "1965 – 1968",
            giai_doan_4: "1969 – 1973",
            giai_doan_5: "1973 – 1975",
            ket_qua: "Nguyên nhân, ý nghĩa"
        },
        mcq: [
            { id: "b8_q01", topic: "boi_canh", lv: 1, q: "Ngay sau Hiệp định Giơ-ne-vơ, Mỹ thay chân Pháp dựng lên chính quyền tay sai ở miền Nam do ai đứng đầu?", o: ["Ngô Đình Diệm", "Bảo Đại", "Nguyễn Văn Thiệu", "Dương Văn Minh"], a: 0, ex: "Mỹ dựng chính quyền tay sai do Ngô Đình Diệm đứng đầu ở miền Nam." },
            { id: "b8_q02", topic: "boi_canh", lv: 1, q: "Âm mưu của Mỹ ở miền Nam Việt Nam sau năm 1954 là", o: ["chia cắt Việt Nam, biến miền Nam thành thuộc địa kiểu mới và căn cứ quân sự", "giúp Việt Nam thống nhất bằng tổng tuyển cử", "trao lại quyền cai trị cho Pháp", "xây dựng miền Nam thành trung tâm kinh tế khu vực"], a: 0, ex: "Mỹ nhằm chia cắt Việt Nam, biến miền Nam thành thuộc địa kiểu mới, căn cứ quân sự ở Đông Nam Á." },
            { id: "b8_q03", topic: "boi_canh", lv: 1, q: "Sau Hiệp định Giơ-ne-vơ, Việt Nam tạm thời bị chia cắt thành", o: ["hai miền với vĩ tuyến 17 làm giới tuyến quân sự tạm thời", "ba miền", "hai nước độc lập", "bốn khu vực hành chính"], a: 0, ex: "Việt Nam tạm thời bị chia cắt làm hai miền." },
            { id: "b8_q04", topic: "boi_canh", lv: 1, q: "Nhiệm vụ của miền Bắc sau năm 1954 là", o: ["hoàn toàn giải phóng, tiến lên xây dựng chủ nghĩa xã hội", "tiếp tục kháng chiến chống Pháp", "thực hiện tổng tuyển cử", "xây dựng căn cứ quân sự"], a: 0, ex: "Miền Bắc được hoàn toàn giải phóng, tiến lên xây dựng chủ nghĩa xã hội." },
            { id: "b8_q05", topic: "boi_canh", lv: 1, q: "Nhiệm vụ của miền Nam sau năm 1954 là", o: ["tiếp tục cuộc cách mạng dân tộc dân chủ nhân dân, thực hiện hoà bình thống nhất nước nhà", "xây dựng chủ nghĩa xã hội", "khôi phục kinh tế sau chiến tranh", "cải cách ruộng đất"], a: 0, ex: "Miền Nam tiếp tục cách mạng dân tộc dân chủ nhân dân, thực hiện hoà bình, thống nhất nước nhà." },
            { id: "b8_q06", topic: "boi_canh", lv: 2, q: "Đặc điểm nào của tình hình thế giới sau năm 1954 tác động đến cách mạng Việt Nam?", o: ["Sự đối đầu giữa hai cực, hai phe và Chiến tranh lạnh", "Chủ nghĩa thực dân đã bị xoá bỏ hoàn toàn", "Mỹ và Liên Xô hợp tác toàn diện", "Chiến tranh thế giới thứ ba bùng nổ"], a: 0, ex: "Sự đối đầu hai cực, hai phe (Chiến tranh lạnh) và chiến lược toàn cầu của Mỹ tác động đến Việt Nam." },

            { id: "b8_q07", topic: "giai_doan_1", lv: 1, q: "Nhiệm vụ của miền Bắc trong giai đoạn 1954–1957 là", o: ["hoàn thành cải cách ruộng đất, khôi phục kinh tế, hàn gắn vết thương chiến tranh", "cải tạo quan hệ sản xuất", "xây dựng kế hoạch 5 năm lần thứ nhất", "chi viện cho miền Nam"], a: 0, ex: "1954–1957: hoàn thành cải cách ruộng đất, khôi phục kinh tế, hàn gắn vết thương chiến tranh." },
            { id: "b8_q08", topic: "giai_doan_1", lv: 1, q: "Giai đoạn 1958–1960, miền Bắc thực hiện nhiệm vụ", o: ["cải tạo quan hệ sản xuất, bước đầu phát triển kinh tế – xã hội", "hoàn thành cải cách ruộng đất", "khôi phục kinh tế sau chiến tranh", "xây dựng chủ nghĩa xã hội hoàn chỉnh"], a: 0, ex: "1958–1960: cải tạo quan hệ sản xuất, bước đầu phát triển kinh tế – xã hội." },
            { id: "b8_q09", topic: "giai_doan_1", lv: 1, q: "Trong những năm 1954–1958, nhân dân miền Nam đấu tranh nhằm mục đích gì?", o: ["Chống Mỹ – chính quyền Ngô Đình Diệm, đòi thi hành Hiệp định Giơ-ne-vơ", "Đòi độc lập hoàn toàn cho miền Nam", "Lật đổ chế độ phong kiến", "Chống Pháp trở lại xâm lược"], a: 0, ex: "Nhân dân miền Nam đấu tranh chống Mỹ – Diệm, đòi thi hành Hiệp định Giơ-ne-vơ." },
            { id: "b8_q10", topic: "giai_doan_1", lv: 1, q: "Hội nghị lần thứ 15 của Đảng (1/1959) khẳng định điều gì?", o: ["Ngoài con đường sử dụng bạo lực cách mạng, nhân dân miền Nam không còn con đường nào khác", "Chỉ đấu tranh chính trị hoà bình", "Chờ tổng tuyển cử thống nhất đất nước", "Rút lực lượng vũ trang về miền Bắc"], a: 0, ex: "Hội nghị khẳng định con đường bạo lực cách mạng là tất yếu." },
            { id: "b8_q11", topic: "giai_doan_1", lv: 1, q: "Phong trào Đồng khởi bắt đầu từ các cuộc nổi dậy của nhân dân", o: ["Vĩnh Thạnh (Gia Lai) và Bác Ái (Khánh Hoà)", "Bến Tre và Trà Bồng", "Mỹ Tho và Cần Thơ", "Quảng Nam và Quảng Ngãi"], a: 0, ex: "Tháng 2/1959: nổi dậy ở Vĩnh Thạnh (Gia Lai), Bác Ái (Khánh Hoà); tháng 8/1959: Trà Bồng (Quảng Ngãi)." },
            { id: "b8_q12", topic: "giai_doan_1", lv: 1, q: "Cuộc Đồng khởi tiêu biểu nhất của phong trào 1959–1960 diễn ra ở", o: ["Bến Tre (1/1960)", "Trà Bồng (8/1959)", "Vĩnh Thạnh (2/1959)", "Bác Ái (2/1959)"], a: 0, ex: "Đồng khởi Bến Tre tháng 1/1960 là cuộc Đồng khởi tiêu biểu." },
            { id: "b8_q13", topic: "giai_doan_1", lv: 2, q: "Thắng lợi của phong trào Đồng khởi có ý nghĩa gì?", o: ["Giáng đòn nặng nề vào chính sách thực dân mới, làm lung lay chính quyền Ngô Đình Diệm", "Lật đổ chính quyền Sài Gòn", "Giải phóng hoàn toàn miền Nam", "Buộc Mỹ rút quân"], a: 0, ex: "Đồng khởi giáng đòn nặng nề vào chính sách thực dân mới, làm lung lay chính quyền Diệm." },
            { id: "b8_q14", topic: "giai_doan_1", lv: 2, q: "Phong trào Đồng khởi đánh dấu bước phát triển nhảy vọt của cách mạng miền Nam, chuyển từ", o: ["thế giữ gìn lực lượng sang thế tiến công", "thế tiến công sang phòng ngự", "đấu tranh vũ trang sang đấu tranh chính trị", "thành thị về nông thôn"], a: 0, ex: "Đồng khởi chuyển cách mạng miền Nam từ thế giữ gìn lực lượng sang thế tiến công." },
            { id: "b8_q15", topic: "giai_doan_1", lv: 1, q: "Mặt trận Dân tộc giải phóng miền Nam Việt Nam được thành lập vào ngày", o: ["20/12/1960", "1/1/1959", "19/12/1946", "6/6/1969"], a: 0, ex: "Mặt trận Dân tộc giải phóng miền Nam Việt Nam thành lập ngày 20/12/1960." },

            { id: "b8_q16", topic: "giai_doan_2", lv: 1, q: "Đại hội đại biểu toàn quốc lần thứ III của Đảng (9/1960) được tổ chức tại", o: ["Hà Nội", "Chiêm Hoá", "Tân Trào", "Cao Bằng"], a: 0, ex: "Đại hội III của Đảng Lao động Việt Nam họp tại Hà Nội tháng 9/1960." },
            { id: "b8_q17", topic: "giai_doan_2", lv: 1, q: "Đại hội III (9/1960) đã xác định", o: ["nhiệm vụ chiến lược của cách mạng cả nước, vai trò, vị trí của cách mạng từng miền", "đường lối kháng chiến chống Pháp", "chính sách cải cách ruộng đất", "kế hoạch xây dựng chủ nghĩa xã hội ở miền Nam"], a: 0, ex: "Đại hội III xác định nhiệm vụ chiến lược của cách mạng cả nước và mối quan hệ giữa cách mạng hai miền." },
            { id: "b8_q18", topic: "giai_doan_2", lv: 1, q: "Kế hoạch Nhà nước 5 năm lần thứ nhất (1961–1965) ở miền Bắc có trọng tâm là", o: ["xây dựng chủ nghĩa xã hội", "cải cách ruộng đất", "khôi phục kinh tế", "phát triển công nghiệp nhẹ"], a: 0, ex: "Trọng tâm của kế hoạch 5 năm lần thứ nhất là xây dựng chủ nghĩa xã hội." },
            { id: "b8_q19", topic: "giai_doan_2", lv: 2, q: "Chiến lược “Chiến tranh đặc biệt” của Mỹ ra đời trong hoàn cảnh nào?", o: ["Hình thức thống trị bằng chính quyền tay sai Ngô Đình Diệm bị thất bại", "Sau thất bại của chiến tranh cục bộ", "Sau Hiệp định Pa-ri", "Khi miền Bắc bắt đầu xây dựng CNXH"], a: 0, ex: "Chiến tranh đặc biệt ra đời khi hình thức thống trị bằng chính quyền tay sai Diệm bị thất bại." },
            { id: "b8_q20", topic: "giai_doan_2", lv: 1, q: "Âm mưu cơ bản của chiến lược “Chiến tranh đặc biệt” là", o: ["dùng người Việt đánh người Việt", "dùng quân Mỹ đánh quân ta", "đưa quân đồng minh vào miền Nam", "tiến hành chiến tranh phá hoại miền Bắc"], a: 0, ex: "Âm mưu cơ bản là “dùng người Việt đánh người Việt”." },
            { id: "b8_q21", topic: "giai_doan_2", lv: 1, q: "Kế hoạch Xta-lây – Tay-lo có nội dung chủ yếu là", o: ["bình định miền Nam trong vòng 18 tháng", "tiêu diệt căn cứ Việt Bắc", "xây dựng quân đội Sài Gòn mạnh", "mở rộng chiến tranh sang Lào"], a: 0, ex: "Xta-lây – Tay-lo chủ yếu bình định miền Nam trong 18 tháng." },
            { id: "b8_q22", topic: "giai_doan_2", lv: 1, q: "“Xương sống” của chiến lược “Chiến tranh đặc biệt” là", o: ["ấp chiến lược", "quân đội Mỹ", "sân bay", "pháo đài"], a: 0, ex: "Dồn dân lập ấp chiến lược được coi là xương sống của chiến tranh đặc biệt." },
            { id: "b8_q23", topic: "giai_doan_2", lv: 1, q: "Chiến thắng Ấp Bắc (tháng 1/1963) có ý nghĩa gì?", o: ["Mở ra khả năng đánh bại chiến thuật “trực thăng vận, thiết xa vận”", "Giải phóng hoàn toàn tỉnh Mỹ Tho", "Buộc Mỹ rút khỏi miền Nam", "Lật đổ chính quyền Ngô Đình Diệm"], a: 0, ex: "Ấp Bắc mở ra khả năng đánh bại “trực thăng vận, thiết xa vận”." },
            { id: "b8_q24", topic: "giai_doan_2", lv: 1, q: "Các chiến thắng Bình Giã, An Lão, Ba Gia, Đồng Xoài (1964–1965) có tác dụng", o: ["làm phá sản hoàn toàn chiến lược “Chiến tranh đặc biệt” của Mỹ", "kết thúc chiến tranh ở miền Nam", "mở đầu chiến tranh cục bộ", "giải phóng Sài Gòn"], a: 0, ex: "Các chiến thắng này làm phá sản hoàn toàn chiến lược “Chiến tranh đặc biệt”." },

            { id: "b8_q25", topic: "giai_doan_3", lv: 1, q: "Sau sự kiện “Vịnh Bắc Bộ” (8/1964), Mỹ đã", o: ["chính thức mở rộng chiến tranh bằng không quân và hải quân phá hoại miền Bắc", "rút quân khỏi miền Nam", "ký Hiệp định Pa-ri", "thay đổi chiến lược sang Việt Nam hoá"], a: 0, ex: "Mỹ mở rộng chiến tranh phá hoại miền Bắc bằng không quân và hải quân." },
            { id: "b8_q26", topic: "giai_doan_3", lv: 1, q: "Chiến tranh phá hoại miền Bắc lần thứ nhất của Mỹ bắt đầu vào thời gian nào?", o: ["Tháng 2/1965", "Tháng 8/1964", "Tháng 12/1972", "Tháng 4/1972"], a: 0, ex: "Từ tháng 2/1965, Mỹ mở rộng chiến tranh phá hoại miền Bắc lần thứ nhất." },
            { id: "b8_q27", topic: "giai_doan_3", lv: 1, q: "Chiến lược “Chiến tranh cục bộ” (1965–1968) được tiến hành bằng lực lượng nào?", o: ["Quân Mỹ, quân đồng minh và quân đội Sài Gòn", "Chỉ quân đội Sài Gòn", "Chỉ quân Mỹ", "Quân đội Sài Gòn và quân Nhật"], a: 0, ex: "Chiến tranh cục bộ tiến hành bằng quân Mỹ, quân đồng minh của Mỹ và quân đội Sài Gòn." },
            { id: "b8_q28", topic: "giai_doan_3", lv: 1, q: "Chiến thắng Vạn Tường (18/8/1965) có ý nghĩa gì?", o: ["Mở ra khả năng đánh thắng Mỹ trong chiến lược “Chiến tranh cục bộ” về quân sự", "Kết thúc chiến tranh cục bộ", "Buộc Mỹ ngừng ném bom miền Bắc", "Giải phóng Quảng Ngãi"], a: 0, ex: "Vạn Tường mở ra khả năng đánh thắng quân Mỹ trong chiến tranh cục bộ." },
            { id: "b8_q29", topic: "giai_doan_3", lv: 1, q: "Quân dân miền Nam đã đập tan cuộc phản công của quân Mỹ và đồng minh trong", o: ["hai mùa khô 1965–1966 và 1966–1967", "mùa khô 1968–1969", "chiến dịch Lam Sơn 719", "chiến dịch Đường 14 – Phước Long"], a: 0, ex: "Hai mùa khô 1965–1966 và 1966–1967 của Mỹ đều bị đập tan." },
            { id: "b8_q30", topic: "giai_doan_3", lv: 1, q: "Cuộc Tổng tiến công và nổi dậy Xuân Mậu Thân 1968 có trọng tâm là", o: ["các đô thị miền Nam", "vùng nông thôn", "căn cứ địa Việt Bắc", "đường Trường Sơn"], a: 0, ex: "Mậu Thân 1968 diễn ra trên toàn miền Nam, trọng tâm là các đô thị." },
            { id: "b8_q31", topic: "giai_doan_3", lv: 2, q: "Thắng lợi của cuộc Tổng tiến công và nổi dậy Xuân Mậu Thân 1968 đã", o: ["làm lung lay ý chí xâm lược của Mỹ, buộc Mỹ “phi Mỹ hoá” chiến tranh", "buộc Mỹ rút hết quân khỏi miền Nam", "giải phóng hoàn toàn miền Nam", "kết thúc chiến tranh phá hoại miền Bắc"], a: 0, ex: "Mậu Thân mở ra bước ngoặt, buộc Mỹ “phi Mỹ hoá” chiến tranh và chấp nhận đàm phán ở Pa-ri." },

            { id: "b8_q32", topic: "giai_doan_4", lv: 1, q: "Chiến lược “Việt Nam hoá chiến tranh” (1969–1973) được tiến hành chủ yếu bằng lực lượng nào?", o: ["Quân đội Sài Gòn, có sự phối hợp hoả lực, không quân, hậu cần của Mỹ", "Quân Mỹ và quân đồng minh", "Quân tình nguyện Việt Nam", "Quân đội Pháp"], a: 0, ex: "Việt Nam hoá chiến tranh dùng quân đội Sài Gòn là chủ yếu, có phối hợp của Mỹ và cố vấn Mỹ chỉ huy." },
            { id: "b8_q33", topic: "giai_doan_4", lv: 2, q: "Một trong những âm mưu của Mỹ khi thực hiện “Việt Nam hoá chiến tranh” là", o: ["rút dần quân Mỹ để giảm xương máu của quân Mỹ trên chiến trường", "tăng quân Mỹ trực tiếp tham chiến", "từ bỏ miền Nam Việt Nam", "chấm dứt chiến tranh phá hoại miền Bắc"], a: 0, ex: "Mỹ rút dần quân để giảm xương máu quân Mỹ, tăng cường quân đội Sài Gòn." },
            { id: "b8_q34", topic: "giai_doan_4", lv: 1, q: "Âm mưu mở rộng chiến tranh của Mỹ trong thời kì “Việt Nam hoá chiến tranh” nhằm", o: ["mở rộng chiến tranh ra toàn Đông Dương", "chỉ giữ chiến tranh ở miền Nam", "rút khỏi Đông Dương", "tấn công miền Bắc bằng bộ binh"], a: 0, ex: "Mỹ mở rộng chiến tranh ra toàn Đông Dương (Đông Dương hoá chiến tranh)." },
            { id: "b8_q35", topic: "giai_doan_4", lv: 2, q: "Năm 1972, Mỹ hoà hoãn với Liên Xô và Trung Quốc nhằm mục đích gì?", o: ["Gây khó khăn cho cuộc kháng chiến của nhân dân ta", "Tăng viện trợ cho Việt Nam", "Chấm dứt Chiến tranh lạnh", "Rút quân khỏi Đông Dương"], a: 0, ex: "Mỹ hoà hoãn với Liên Xô, Trung Quốc nhằm gây khó khăn cho kháng chiến của ta." },
            { id: "b8_q36", topic: "giai_doan_4", lv: 1, q: "Tháng 3/1972, quân ta đã chọc thủng ba phòng tuyến của địch ở", o: ["Quảng Trị, Tây Nguyên và Đông Nam Bộ", "Lạng Sơn, Cao Bằng, Lào Cai", "Huế, Đà Nẵng, Sài Gòn", "Đồng bằng sông Cửu Long"], a: 0, ex: "Ta chọc thủng ba phòng tuyến ở Quảng Trị, Tây Nguyên và Đông Nam Bộ." },
            { id: "b8_q37", topic: "giai_doan_4", lv: 1, q: "Chính phủ cách mạng lâm thời Cộng hoà miền Nam Việt Nam ra đời ngày", o: ["6/6/1969", "20/12/1960", "27/1/1973", "30/4/1975"], a: 0, ex: "Ngày 6/6/1969, Chính phủ cách mạng lâm thời Cộng hoà miền Nam Việt Nam ra đời." },
            { id: "b8_q38", topic: "giai_doan_4", lv: 1, q: "Tháng 4/1970, sự kiện nào thể hiện quyết tâm chống Mỹ của nhân dân ba nước Đông Dương?", o: ["Hội nghị cấp cao ba nước Việt Nam – Lào – Cam-pu-chia", "Thành lập Mặt trận Dân tộc giải phóng", "Ký Hiệp định Pa-ri", "Thành lập Liên minh nhân dân Việt – Miên – Lào"], a: 0, ex: "Hội nghị cấp cao ba nước Việt Nam – Lào – Cam-pu-chia họp tháng 4/1970." },
            { id: "b8_q39", topic: "giai_doan_4", lv: 1, q: "Trận “Điện Biên Phủ trên không” diễn ra trong khoảng thời gian nào?", o: ["18 – 29/12/1972", "18 – 29/12/1973", "4/1972", "2/1965"], a: 0, ex: "Từ 18 đến 29/12/1972, Mỹ tập kích chiến lược bằng B52 vào Hà Nội, Hải Phòng…" },
            { id: "b8_q40", topic: "giai_doan_4", lv: 2, q: "Hiệp định Pa-ri (1973) được ký kết có ý nghĩa gì?", o: ["Chấm dứt chiến tranh, lập lại hoà bình ở Việt Nam", "Thống nhất đất nước", "Chấm dứt Chiến tranh lạnh", "Buộc Pháp rút quân"], a: 0, ex: "Hiệp định Pa-ri chấm dứt chiến tranh, lập lại hoà bình ở Việt Nam." },

            { id: "b8_q41", topic: "giai_doan_5", lv: 1, q: "Sau Hiệp định Pa-ri, Mỹ đã", o: ["giữ lại hơn 2 vạn “cố vấn” quân sự, tiếp tục viện trợ cho chính quyền Sài Gòn", "rút toàn bộ quân và chấm dứt viện trợ", "trao trả độc lập cho miền Nam", "công nhận Chính phủ cách mạng lâm thời"], a: 0, ex: "Mỹ giữ lại hơn 2 vạn cố vấn, tiếp tục viện trợ quân sự, kinh tế cho chính quyền Sài Gòn." },
            { id: "b8_q42", topic: "giai_doan_5", lv: 1, q: "Hội nghị Ban Chấp hành Trung ương Đảng lần thứ 21 (7/1973) nhấn mạnh điều gì?", o: ["Tiếp tục con đường bạo lực cách mạng, nắm vững chiến lược tiến công trên ba mặt trận", "Chuyển sang đấu tranh chính trị hoà bình", "Chờ tổng tuyển cử thống nhất", "Rút lực lượng về miền Bắc"], a: 0, ex: "Nghị quyết 21 nhấn mạnh tiếp tục bạo lực cách mạng, tiến công trên ba mặt trận quân sự, chính trị, ngoại giao." },
            { id: "b8_q43", topic: "giai_doan_5", lv: 1, q: "Chiến dịch Đường 14 – Phước Long (cuối 1974 – đầu 1975) được coi là", o: ["trận trinh sát chiến lược", "trận mở màn cho chiến dịch Hồ Chí Minh", "trận phòng ngự chiến lược", "trận quyết định của cuộc kháng chiến"], a: 0, ex: "Đây là trận trinh sát chiến lược, thăm dò khả năng phản ứng của Mỹ và Sài Gòn." },
            { id: "b8_q44", topic: "giai_doan_5", lv: 2, q: "Thắng lợi của chiến dịch Đường 14 – Phước Long cho thấy điều gì?", o: ["Quân ta có khả năng thắng lớn, quân đội Sài Gòn suy yếu, khả năng can thiệp trở lại của Mỹ rất hạn chế", "Mỹ sẽ can thiệp trở lại bằng không quân", "Quân đội Sài Gòn còn mạnh", "Ta chưa đủ khả năng tiến công"], a: 0, ex: "Phước Long chứng tỏ khả năng thắng lớn của ta và sự suy yếu, bất lực của quân đội Sài Gòn." },
            { id: "b8_q45", topic: "giai_doan_5", lv: 1, q: "Cuộc Tổng tiến công và nổi dậy Xuân 1975 trải qua ba chiến dịch lớn là", o: ["Tây Nguyên, Huế – Đà Nẵng và Hồ Chí Minh", "Việt Bắc, Biên giới, Điện Biên Phủ", "Đường 14 – Phước Long, Tây Nguyên, Sài Gòn", "Quảng Trị, Tây Nguyên, Đông Nam Bộ"], a: 0, ex: "Ba chiến dịch: Tây Nguyên, Huế – Đà Nẵng, Hồ Chí Minh." },
            { id: "b8_q46", topic: "giai_doan_5", lv: 1, q: "Sự kiện đánh dấu toàn thắng của Chiến dịch Hồ Chí Minh là", o: ["11 giờ 30 ngày 30/4/1975, cờ cách mạng tung bay trên nóc Dinh Độc Lập", "ngày 10/3/1975 giải phóng Buôn Ma Thuột", "ngày 29/3/1975 giải phóng Đà Nẵng", "ngày 27/1/1973 ký Hiệp định Pa-ri"], a: 0, ex: "11 giờ 30 ngày 30/4/1975, cờ cách mạng tung bay trên nóc Dinh Độc Lập." },

            { id: "b8_q47", topic: "ket_qua", lv: 2, q: "Nguyên nhân chủ quan hàng đầu của thắng lợi kháng chiến chống Mỹ là", o: ["sự lãnh đạo sáng suốt của Đảng với đường lối chính trị, quân sự độc lập, tự chủ, đúng đắn, sáng tạo", "sự giúp đỡ của Liên Xô và Trung Quốc", "phong trào phản chiến của nhân dân Mỹ", "sự đoàn kết của ba nước Đông Dương"], a: 0, ex: "Sự lãnh đạo của Đảng với đường lối độc lập, tự chủ, đúng đắn, sáng tạo là nguyên nhân chủ quan hàng đầu." },
            { id: "b8_q48", topic: "ket_qua", lv: 1, q: "Một nguyên nhân chủ quan của thắng lợi kháng chiến chống Mỹ là", o: ["nhân dân giàu lòng yêu nước, đoàn kết, lao động cần cù, chiến đấu dũng cảm", "sự ủng hộ của các nước xã hội chủ nghĩa", "phong trào phản đối chiến tranh ở Mỹ", "sự giúp đỡ của nhân dân Lào, Cam-pu-chia"], a: 0, ex: "Lòng yêu nước, đoàn kết, dũng cảm của nhân dân tạo nên sức mạnh chiến thắng." },
            { id: "b8_q49", topic: "ket_qua", lv: 1, q: "Hậu phương miền Bắc trong kháng chiến chống Mỹ có vai trò gì?", o: ["Không ngừng lớn mạnh, đáp ứng kịp thời yêu cầu chiến đấu ở hai miền", "Chỉ làm nhiệm vụ sản xuất nông nghiệp", "Không chi viện cho miền Nam", "Chỉ nhận viện trợ quốc tế"], a: 0, ex: "Hậu phương miền Bắc lớn mạnh, đáp ứng yêu cầu của cuộc chiến đấu ở hai miền." },
            { id: "b8_q50", topic: "ket_qua", lv: 1, q: "Nguyên nhân khách quan của thắng lợi kháng chiến chống Mỹ là", o: ["sự phối hợp, giúp đỡ của nhân dân Lào, Cam-pu-chia và các lực lượng hoà bình, dân chủ trên thế giới", "sự lãnh đạo của Đảng", "hậu phương miền Bắc vững mạnh", "tinh thần chiến đấu của nhân dân"], a: 0, ex: "Sự phối hợp ba nước Đông Dương và ủng hộ của lực lượng hoà bình, dân chủ là nguyên nhân khách quan." },
            { id: "b8_q51", topic: "ket_qua", lv: 1, q: "Thắng lợi của kháng chiến chống Mỹ đã kết thúc", o: ["21 năm chiến đấu chống đế quốc Mỹ xâm lược, 30 năm chiến tranh cách mạng", "cuộc kháng chiến chống Pháp", "Chiến tranh lạnh", "chế độ phong kiến Việt Nam"], a: 0, ex: "Thắng lợi kết thúc 21 năm chống Mỹ, 30 năm chiến tranh cách mạng." },
            { id: "b8_q52", topic: "ket_qua", lv: 2, q: "Đối với Việt Nam, thắng lợi kháng chiến chống Mỹ đã mở ra kỉ nguyên", o: ["cả nước hoà bình, độc lập, thống nhất, đi lên chủ nghĩa xã hội", "công nghiệp hoá, hiện đại hoá", "đấu tranh chống thực dân", "hội nhập kinh tế quốc tế"], a: 0, ex: "Thắng lợi mở ra kỉ nguyên cả nước hoà bình, độc lập, thống nhất, đi lên CNXH." },
            { id: "b8_q53", topic: "ket_qua", lv: 2, q: "Đối với quốc tế, thắng lợi kháng chiến chống Mỹ đã", o: ["góp phần làm sụp đổ chủ nghĩa thực dân mới, cổ vũ phong trào giải phóng dân tộc", "chấm dứt Trật tự hai cực I-an-ta", "mở đầu Chiến tranh lạnh", "thành lập phong trào không liên kết"], a: 0, ex: "Thắng lợi góp phần làm sụp đổ chủ nghĩa thực dân mới, cổ vũ phong trào giải phóng dân tộc." },
            { id: "b8_q54", topic: "giai_doan_2", lv: 3, q: "Điểm khác biệt cơ bản giữa chiến lược “Chiến tranh đặc biệt” và “Chiến tranh cục bộ” là", o: ["lực lượng chủ yếu: quân đội Sài Gòn (Chiến tranh đặc biệt) và quân Mỹ, đồng minh cùng quân đội Sài Gòn (Chiến tranh cục bộ)", "mục tiêu chống cách mạng miền Nam", "có cố vấn Mỹ trực tiếp chỉ huy", "gắn với chiến tranh phá hoại miền Bắc"], a: 0, ex: "Khác biệt chủ yếu nằm ở lực lượng tham chiến: Chiến tranh đặc biệt dùng quân đội Sài Gòn là chính; Chiến tranh cục bộ có quân Mỹ, đồng minh trực tiếp tham chiến." },
            { id: "b8_q55", topic: "giai_doan_3", lv: 3, q: "Thắng lợi Vạn Tường (1965) và hai mùa khô 1965–1967 chứng tỏ điều gì?", o: ["Quân dân miền Nam có thể đánh bại quân Mỹ trong chiến lược “Chiến tranh cục bộ”", "Mỹ đã rút hết quân khỏi miền Nam", "Chiến tranh cục bộ đã chấm dứt", "Miền Bắc đã hoàn thành xây dựng chủ nghĩa xã hội"], a: 0, ex: "Vạn Tường mở ra khả năng đánh thắng Mỹ; hai mùa khô bị đập tan chứng tỏ ta có thể làm thất bại chiến tranh cục bộ." },
            { id: "b8_q56", topic: "giai_doan_4", lv: 3, q: "Vì sao sau Tết Mậu Thân 1968 Mỹ phải chuyển sang chiến lược “Việt Nam hoá chiến tranh”?", o: ["Do thất bại trên chiến trường và sức ép phản chiến, Mỹ cần rút dần quân mà vẫn duy trì chính quyền Sài Gòn", "Do Mỹ đã hoàn thành mục tiêu xâm lược", "Do quân đội Sài Gòn đã đủ mạnh để thay thế hoàn toàn quân Mỹ", "Do Liên Xô và Trung Quốc yêu cầu Mỹ rút quân"], a: 0, ex: "Mậu Thân 1968 làm lung lay ý chí xâm lược; Mỹ buộc phải “phi Mỹ hoá” chiến tranh, rút dần quân, dùng quân đội Sài Gòn là chủ yếu." },
            { id: "b8_q57", topic: "giai_doan_4", lv: 3, q: "Vì sao thắng lợi của trận “Điện Biên Phủ trên không” (12/1972) có ý nghĩa quyết định?", o: ["Buộc Mỹ phải ký Hiệp định Pa-ri, chấm dứt chiến tranh, rút quân về nước", "Buộc Mỹ chấm dứt viện trợ cho chính quyền Sài Gòn", "Lật đổ chính quyền Sài Gòn", "Giải phóng hoàn toàn miền Nam"], a: 0, ex: "Thất bại nặng nề của B52 buộc Mỹ ký Hiệp định Pa-ri (27/1/1973), chấm dứt chiến tranh, rút quân về nước." },
            { id: "b8_q58", topic: "giai_doan_5", lv: 3, q: "Vì sao Đảng chọn Tây Nguyên làm hướng tiến công mở màn trong cuộc Tổng tiến công Xuân 1975?", o: ["Tây Nguyên là địa bàn chiến lược quan trọng nhưng địch bố phòng sơ hở, có thể tạo bất ngờ và mở rộng thắng lợi", "Tây Nguyên là nơi tập trung toàn bộ quân chủ lực của địch", "Tây Nguyên gần miền Bắc nên dễ chi viện", "Tây Nguyên là trung tâm chính trị của chính quyền Sài Gòn"], a: 0, ex: "Tây Nguyên có vị trí chiến lược nhưng địch bố phòng mỏng; thắng lợi Buôn Ma Thuột tạo bất ngờ, mở ra thế tiến công chiến lược." },
            { id: "b8_q59", topic: "ket_qua", lv: 3, q: "Bài học nào được Đảng vận dụng trong công cuộc đổi mới từ thắng lợi của kháng chiến chống Mỹ?", o: ["Kết hợp sức mạnh dân tộc với sức mạnh thời đại, giữ vững độc lập tự chủ", "Chỉ dựa vào viện trợ nước ngoài", "Chỉ dựa vào lực lượng vũ trang chính quy", "Đóng cửa, không hội nhập quốc tế"], a: 0, ex: "Thắng lợi khẳng định bài học kết hợp sức mạnh dân tộc với sức mạnh thời đại, giữ vững độc lập tự chủ, đoàn kết quốc tế." }
        ],

        tf: [
            {
                id: "b8_tf01", topic: "boi_canh",
                lead: "Đọc thông tin sau: Ngay sau Hiệp định Giơ-ne-vơ, Mỹ thay chân Pháp, dựng lên chính quyền tay sai đứng đầu là Ngô Đình Diệm ở miền Nam Việt Nam. Mỹ nhằm chia cắt Việt Nam, biến miền Nam thành thuộc địa kiểu mới và căn cứ quân sự.",
                s: [
                    { t: "Mỹ dựng chính quyền tay sai do Ngô Đình Diệm đứng đầu ở miền Nam.", ok: true, ex: "Đúng: chính quyền Sài Gòn do Ngô Đình Diệm đứng đầu." },
                    { t: "Âm mưu của Mỹ là chia cắt Việt Nam lâu dài.", ok: true, ex: "Đúng: chia cắt Việt Nam, biến miền Nam thành thuộc địa kiểu mới." },
                    { t: "Sau Hiệp định Giơ-ne-vơ, miền Bắc vẫn nằm dưới ách thống trị của Pháp.", ok: false, ex: "Sai: miền Bắc được hoàn toàn giải phóng." },
                    { t: "Sau năm 1954, Việt Nam tạm thời bị chia cắt làm hai miền.", ok: true, ex: "Đúng: đất nước tạm thời chia cắt hai miền." }
                ]
            },
            {
                id: "b8_tf02", topic: "giai_doan_1",
                lead: "Đọc thông tin sau: Ở miền Bắc, giai đoạn 1954–1957 hoàn thành cải cách ruộng đất, khôi phục kinh tế, hàn gắn vết thương chiến tranh; giai đoạn 1958–1960 cải tạo quan hệ sản xuất, bước đầu phát triển kinh tế – xã hội.",
                s: [
                    { t: "Năm 1954–1957, miền Bắc hoàn thành cải cách ruộng đất.", ok: true, ex: "Đúng: đây là nhiệm vụ của miền Bắc giai đoạn 1954–1957." },
                    { t: "Năm 1958–1960, miền Bắc tiến hành cải tạo quan hệ sản xuất.", ok: true, ex: "Đúng: bước đầu phát triển kinh tế – xã hội." },
                    { t: "Trong giai đoạn 1954–1958, nhân dân miền Nam đấu tranh đòi thi hành Hiệp định Giơ-ne-vơ.", ok: true, ex: "Đúng: đấu tranh chống Mỹ – Diệm, đòi thi hành Hiệp định." },
                    { t: "Năm 1958, miền Bắc bắt đầu thực hiện kế hoạch 5 năm lần thứ nhất.", ok: false, ex: "Sai: kế hoạch 5 năm lần thứ nhất thực hiện từ 1961 đến 1965." }
                ]
            },
            {
                id: "b8_tf03", topic: "giai_doan_1",
                lead: "Đọc thông tin sau: Tháng 1/1959, Hội nghị lần thứ 15 của Đảng khẳng định ngoài con đường sử dụng bạo lực cách mạng, nhân dân miền Nam không còn con đường nào khác. Phong trào Đồng khởi bùng nổ từ tháng 2/1959.",
                s: [
                    { t: "Hội nghị Trung ương lần thứ 15 họp tháng 1/1959.", ok: true, ex: "Đúng: Hội nghị lần thứ 15 (1/1959)." },
                    { t: "Phong trào Đồng khởi bắt đầu từ Vĩnh Thạnh (Gia Lai) và Bác Ái (Khánh Hoà).", ok: true, ex: "Đúng: nổi dậy tháng 2/1959 ở hai địa phương này." },
                    { t: "Cuộc Đồng khởi tiêu biểu nhất diễn ra ở Bến Tre vào tháng 1/1960.", ok: true, ex: "Đúng: Đồng khởi Bến Tre tháng 1/1960." },
                    { t: "Đồng khởi đánh dấu việc cách mạng miền Nam chuyển từ thế tiến công sang giữ gìn lực lượng.", ok: false, ex: "Sai: chuyển từ thế giữ gìn lực lượng sang thế tiến công." }
                ]
            },
            {
                id: "b8_tf04", topic: "giai_doan_2",
                lead: "Đọc thông tin sau: Đại hội đại biểu toàn quốc lần thứ III của Đảng (9/1960) xác định nhiệm vụ chiến lược của cách mạng cả nước. Ở miền Nam, Mỹ thực hiện chiến lược “Chiến tranh đặc biệt” với kế hoạch Xta-lây – Tay-lo.",
                s: [
                    { t: "Đại hội III của Đảng họp tại Hà Nội tháng 9/1960.", ok: true, ex: "Đúng: Đại hội III họp tại Hà Nội." },
                    { t: "Kế hoạch Xta-lây – Tay-lo chủ yếu bình định miền Nam trong 18 tháng.", ok: true, ex: "Đúng: nội dung chủ yếu của kế hoạch." },
                    { t: "Âm mưu cơ bản của “Chiến tranh đặc biệt” là dùng quân Mỹ trực tiếp đánh quân ta.", ok: false, ex: "Sai: là “dùng người Việt đánh người Việt”." },
                    { t: "Ấp chiến lược được coi là xương sống của chiến lược “Chiến tranh đặc biệt”.", ok: true, ex: "Đúng: dồn dân lập ấp chiến lược là xương sống." }
                ]
            },
            {
                id: "b8_tf05", topic: "giai_doan_2",
                lead: "Đọc thông tin sau: Chiến thắng Ấp Bắc (tháng 1/1963) mở ra khả năng đánh bại chiến thuật “trực thăng vận, thiết xa vận”. Trong những năm 1964–1965, quân ta thắng lớn ở Bình Giã, An Lão, Ba Gia, Đồng Xoài.",
                s: [
                    { t: "Chiến thắng Ấp Bắc diễn ra tháng 1/1963.", ok: true, ex: "Đúng: tháng 1/1963." },
                    { t: "Ấp Bắc chứng minh quân dân ta có thể đánh bại “Chiến tranh đặc biệt”.", ok: true, ex: "Đúng: mở ra khả năng đánh bại chiến lược này." },
                    { t: "Sau Ấp Bắc, phong trào “Thi đua Ấp Bắc, giết giặc lập công” dấy lên khắp miền Nam.", ok: true, ex: "Đúng: phong trào lan rộng khắp miền Nam." },
                    { t: "Các chiến thắng 1964–1965 chỉ có ý nghĩa chiến thuật, không ảnh hưởng đến chiến lược của Mỹ.", ok: false, ex: "Sai: các chiến thắng này làm phá sản hoàn toàn chiến lược “Chiến tranh đặc biệt”." }
                ]
            },
            {
                id: "b8_tf06", topic: "giai_doan_3",
                lead: "Đọc thông tin sau: Sau khi dựng lên sự kiện “Vịnh Bắc Bộ” (8/1964), Mỹ chính thức mở rộng chiến tranh bằng không quân và hải quân phá hoại miền Bắc lần thứ nhất (2/1965). Ở miền Nam, Mỹ chuyển sang chiến lược “Chiến tranh cục bộ”.",
                s: [
                    { t: "Sự kiện “Vịnh Bắc Bộ” diễn ra tháng 8/1964.", ok: true, ex: "Đúng: Mỹ dựng lên sự kiện Vịnh Bắc Bộ tháng 8/1964." },
                    { t: "Mỹ mở chiến tranh phá hoại miền Bắc lần thứ nhất từ tháng 2/1965.", ok: true, ex: "Đúng: chiến tranh phá hoại lần thứ nhất bắt đầu 2/1965." },
                    { t: "“Chiến tranh cục bộ” được tiến hành bằng quân Mỹ, quân đồng minh và quân đội Sài Gòn.", ok: true, ex: "Đúng: đây là thành phần lực lượng của chiến tranh cục bộ." },
                    { t: "Quân dân miền Bắc không chống trả chiến tranh phá hoại mà chỉ sơ tán.", ok: false, ex: "Sai: miền Bắc vừa chiến đấu chống phá hoại, vừa phát triển kinh tế – xã hội." }
                ]
            },
            {
                id: "b8_tf07", topic: "giai_doan_3",
                lead: "Đọc thông tin sau: Quân dân miền Nam giành thắng lợi ở Vạn Tường (18/8/1965), đập tan các cuộc phản công trong hai mùa khô 1965–1966 và 1966–1967; năm 1968 mở cuộc Tổng tiến công và nổi dậy Xuân Mậu Thân.",
                s: [
                    { t: "Chiến thắng Vạn Tường diễn ra ngày 18/8/1965.", ok: true, ex: "Đúng: Vạn Tường (18/8/1965)." },
                    { t: "Hai mùa khô 1965–1966 và 1966–1967 của Mỹ đều bị đập tan.", ok: true, ex: "Đúng: quân dân miền Nam đập tan hai cuộc phản công." },
                    { t: "Cuộc Tổng tiến công Xuân Mậu Thân 1968 có trọng tâm là nông thôn đồng bằng.", ok: false, ex: "Sai: trọng tâm là các đô thị miền Nam." },
                    { t: "Mậu Thân 1968 buộc Mỹ chấp nhận đàm phán ở Pa-ri.", ok: true, ex: "Đúng: Mỹ chấp nhận đàm phán về chấm dứt chiến tranh." }
                ]
            },
            {
                id: "b8_tf08", topic: "giai_doan_4",
                lead: "Đọc thông tin sau: Sau thất bại của “Chiến tranh cục bộ”, Mỹ chuyển sang chiến lược “Việt Nam hoá chiến tranh” (1969–1973) ở miền Nam và mở rộng chiến tranh phá hoại miền Bắc lần thứ hai.",
                s: [
                    { t: "“Việt Nam hoá chiến tranh” được tiến hành chủ yếu bằng quân đội Sài Gòn.", ok: true, ex: "Đúng: quân đội Sài Gòn là lực lượng chủ yếu." },
                    { t: "Mỹ rút dần quân để giảm xương máu của quân Mỹ trên chiến trường.", ok: true, ex: "Đúng: đây là một âm mưu, thủ đoạn của Mỹ." },
                    { t: "Mỹ mở rộng chiến tranh ra toàn Đông Dương.", ok: true, ex: "Đúng: Mỹ mở rộng chiến tranh ra toàn Đông Dương." },
                    { t: "“Việt Nam hoá chiến tranh” được Mỹ thực hiện trước “Chiến tranh cục bộ”.", ok: false, ex: "Sai: Việt Nam hoá (1969–1973) diễn ra sau Chiến tranh cục bộ (1965–1968)." }
                ]
            },
            {
                id: "b8_tf09", topic: "giai_doan_4",
                lead: "Đọc thông tin sau: Ngày 6/6/1969, Chính phủ cách mạng lâm thời Cộng hoà miền Nam Việt Nam ra đời. Tháng 4/1970, Hội nghị cấp cao ba nước Việt Nam – Lào – Cam-pu-chia được tổ chức. Tháng 3/1972, quân ta chọc thủng ba phòng tuyến của địch.",
                s: [
                    { t: "Chính phủ cách mạng lâm thời Cộng hoà miền Nam Việt Nam ra đời ngày 6/6/1969.", ok: true, ex: "Đúng: đây là chính phủ hợp pháp của nhân dân miền Nam." },
                    { t: "Hội nghị cấp cao ba nước Đông Dương họp tháng 4/1970.", ok: true, ex: "Đúng: biểu thị quyết tâm chống Mỹ của ba nước." },
                    { t: "Tháng 3/1972, quân ta chọc thủng ba phòng tuyến ở Quảng Trị, Tây Nguyên, Đông Nam Bộ.", ok: true, ex: "Đúng: thắng lợi quan trọng của cuộc tiến công 1972." },
                    { t: "Sau thắng lợi 1972, Mỹ tuyên bố rút toàn bộ quân khỏi miền Nam.", ok: false, ex: "Sai: Mỹ tuyên bố “Mỹ hoá trở lại” chiến tranh, tiếp tục can thiệp." }
                ]
            },
            {
                id: "b8_tf10", topic: "giai_doan_4",
                lead: "Đọc thông tin sau: Từ 18 đến 29/12/1972, Mỹ tiến hành tập kích chiến lược bằng máy bay B52 vào Hà Nội, Hải Phòng nhằm giành thắng lợi quân sự quyết định. Quân dân miền Bắc làm nên trận “Điện Biên Phủ trên không”.",
                s: [
                    { t: "Mỹ tập kích bằng B52 vào Hà Nội, Hải Phòng từ 18 đến 29/12/1972.", ok: true, ex: "Đúng: thời gian và địa điểm chính xác." },
                    { t: "Trận “Điện Biên Phủ trên không” buộc Mỹ ngừng hẳn hoạt động chống phá miền Bắc.", ok: true, ex: "Đúng: Mỹ ngừng hẳn hoạt động chống phá miền Bắc." },
                    { t: "Sau trận “Điện Biên Phủ trên không”, Mỹ ký Hiệp định Pa-ri (1973).", ok: true, ex: "Đúng: Hiệp định Pa-ri được ký năm 1973." },
                    { t: "Hiệp định Pa-ri buộc Mỹ phải bồi thường chiến tranh cho Việt Nam.", ok: false, ex: "Sai: Hiệp định Pa-ri chấm dứt chiến tranh, lập lại hoà bình ở Việt Nam." }
                ]
            },
            {
                id: "b8_tf11", topic: "giai_doan_5",
                lead: "Đọc thông tin sau: Tháng 7/1973, Hội nghị Ban Chấp hành Trung ương Đảng lần thứ 21 nhấn mạnh tiếp tục con đường bạo lực cách mạng, nắm vững chiến lược tiến công. Cuối năm 1974 – đầu năm 1975, quân dân miền Nam giành thắng lợi ở chiến dịch Đường 14 – Phước Long.",
                s: [
                    { t: "Nghị quyết 21 của Trung ương Đảng được ban hành tháng 7/1973.", ok: true, ex: "Đúng: Hội nghị lần thứ 21 họp tháng 7/1973." },
                    { t: "Chiến dịch Đường 14 – Phước Long được coi là trận trinh sát chiến lược.", ok: true, ex: "Đúng: đây là trận trinh sát chiến lược." },
                    { t: "Thắng lợi Phước Long cho thấy khả năng can thiệp trở lại của Mỹ rất hạn chế.", ok: true, ex: "Đúng: đây là ý nghĩa của chiến thắng Phước Long." },
                    { t: "Cuộc Tổng tiến công Xuân 1975 chỉ diễn ra ở Tây Nguyên.", ok: false, ex: "Sai: diễn ra trên toàn miền Nam với ba chiến dịch lớn." }
                ]
            },
            {
                id: "b8_tf12", topic: "ket_qua",
                lead: "Đọc thông tin sau: Thắng lợi của cuộc kháng chiến chống Mỹ, cứu nước đã kết thúc 21 năm chiến đấu chống đế quốc Mỹ xâm lược, 30 năm chiến tranh cách mạng; chấm dứt ách thống trị của chủ nghĩa đế quốc trên đất nước Việt Nam.",
                s: [
                    { t: "Kháng chiến chống Mỹ kết thúc 21 năm chiến đấu chống đế quốc Mỹ.", ok: true, ex: "Đúng: 1954–1975 là 21 năm." },
                    { t: "Thắng lợi mở ra kỉ nguyên cả nước hoà bình, độc lập, thống nhất, đi lên chủ nghĩa xã hội.", ok: true, ex: "Đúng: đây là ý nghĩa trọng đại với dân tộc." },
                    { t: "Thắng lợi của ta không tác động đến phong trào giải phóng dân tộc trên thế giới.", ok: false, ex: "Sai: thắng lợi cổ vũ mạnh mẽ phong trào giải phóng dân tộc." },
                    { t: "Sự ủng hộ của các nước xã hội chủ nghĩa và phong trào phản chiến là nguyên nhân khách quan.", ok: true, ex: "Đúng: đây là nguyên nhân khách quan của thắng lợi." }
                ]
            }
        ]
    }
};
