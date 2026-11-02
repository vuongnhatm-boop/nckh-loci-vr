// app/reminder_137.js - Hệ thống Thuật toán Chu kỳ Ôn tập 1-3-7 & Đặt Giờ Nhắc Hẹn trên Web
(function (window) {
    'use strict';

    const isEmbedded = (typeof window !== 'undefined' && window.self !== window.top);
    
    // Tự động dọn dẹp các toast cũ nếu có
    if (typeof document !== 'undefined') {
        const oldToasts = document.getElementById('loci-toast-container');
        if (oldToasts) oldToasts.remove();
    }

    const CYCLE_MS = {
        cycle1: 1 * 24 * 60 * 60 * 1000, // 24 giờ (Ngày 1)
        cycle3: 3 * 24 * 60 * 60 * 1000, // 72 giờ (Ngày 3)
        cycle7: 7 * 24 * 60 * 60 * 1000  // 168 giờ (Ngày 7)
    };

    const STORAGE_KEY_137 = 'loci_cycle_137_data';
    const STORAGE_KEY_SETTINGS = 'loci_reminder_settings';

    // 1. Quản lý dữ liệu chu kỳ 1-3-7
    function getCycleData() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_137) || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveCycleData(data) {
        try {
            localStorage.setItem(STORAGE_KEY_137, JSON.stringify(data));
        } catch (e) {}
    }

    // 2. Quản lý cài đặt nhắc hẹn
    function getSettings() {
        const defaults = {
            enabled: true,
            time: '20:00', // Giờ mặc định 20:00 mỗi tối
            notify137: true,
            sound: true,
            lastNotifiedDate: null,
            lastNotified137Lesson: null,
            notifiedLessons: {}
        };
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}');
            return Object.assign(defaults, saved);
        } catch (e) {
            return defaults;
        }
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
        } catch (e) {}
    }

    // 3. Ghi nhận khi học xong 1 bài (cập nhật chu kỳ)
    function recordLessonCompleted(lessonId, scorePercent = 100) {
        const data = getCycleData();
        const now = Date.now();
        const item = data[lessonId] || {
            lessonId,
            history: [],
            lastCompletedAt: 0,
            cycle1Done: false,
            cycle3Done: false,
            cycle7Done: false
        };

        // Nếu đã từng làm, kiểm tra lần làm này hoàn tất mốc nào
        if (item.lastCompletedAt > 0) {
            const elapsed = now - item.lastCompletedAt;
            if (elapsed >= CYCLE_MS.cycle1 && !item.cycle1Done) {
                item.cycle1Done = true;
                item.cycle1DoneAt = now;
            } else if (elapsed >= CYCLE_MS.cycle3 && item.cycle1Done && !item.cycle3Done) {
                item.cycle3Done = true;
                item.cycle3DoneAt = now;
            } else if (elapsed >= CYCLE_MS.cycle7 && item.cycle3Done && !item.cycle7Done) {
                item.cycle7Done = true;
                item.cycle7DoneAt = now;
            }
        }

        // Cập nhật mốc hoàn thành mới
        item.lastCompletedAt = now;
        if (!item.history) item.history = [];
        item.history.push({ timestamp: now, scorePercent });
        data[lessonId] = item;
        saveCycleData(data);
        return item;
    }

    // 4. Lấy trạng thái chi tiết chu kỳ 1-3-7 của một bài
    function getLessonCycleStatus(lessonId) {
        const data = getCycleData();
        const item = data[lessonId];
        const now = Date.now();

        if (!item || !item.lastCompletedAt) {
            return {
                lessonId,
                hasStarted: false,
                currentMilestone: 1,
                overallText: 'Chưa bắt đầu chu kỳ 1-3-7',
                milestones: {
                    cycle1: { label: 'Ngày 1 (+24h)', desc: 'Củng cố trí nhớ ban đầu', status: 'pending', text: 'Chưa làm bài', dueAt: null },
                    cycle3: { label: 'Ngày 3 (+72h)', desc: 'Ngăn sụt giảm trí nhớ', status: 'pending', text: 'Chờ ngày 1', dueAt: null },
                    cycle7: { label: 'Ngày 7 (+168h)', desc: 'Khắc sâu trí nhớ dài hạn', status: 'pending', text: 'Chờ ngày 3', dueAt: null }
                }
            };
        }

        const t0 = item.lastCompletedAt;
        const due1 = t0 + CYCLE_MS.cycle1;
        const due3 = t0 + CYCLE_MS.cycle3;
        const due7 = t0 + CYCLE_MS.cycle7;

        function calcMilestone(isDone, dueTime, prevDone, label, desc) {
            if (isDone) {
                return { label, desc, status: 'done', text: '✅ Đã hoàn thành', dueAt: dueTime, isDone: true };
            }
            if (!prevDone) {
                return { label, desc, status: 'pending', text: '🔒 Chờ mốc trước', dueAt: dueTime };
            }
            const diff = dueTime - now;
            if (diff <= 0) {
                return { label, desc, status: 'due', text: '⚡ Đến hạn hôm nay!', dueAt: dueTime, isDue: true };
            }
            const hours = Math.ceil(diff / (1000 * 60 * 60));
            if (hours < 24) {
                return { label, desc, status: 'waiting', text: `⏳ Còn ${hours} giờ`, dueAt: dueTime };
            }
            const days = Math.ceil(hours / 24);
            return { label, desc, status: 'waiting', text: `⏳ Còn ${days} ngày`, dueAt: dueTime };
        }

        const m1 = calcMilestone(item.cycle1Done, due1, true, 'Ngày 1 (+24h)', 'Củng cố trí nhớ ban đầu');
        const m3 = calcMilestone(item.cycle3Done, due3, item.cycle1Done, 'Ngày 3 (+72h)', 'Ngăn sụt giảm trí nhớ');
        const m7 = calcMilestone(item.cycle7Done, due7, item.cycle3Done, 'Ngày 7 (+168h)', 'Khắc sâu trí nhớ dài hạn');

        let overallText = 'Đang trong lộ trình 1-3-7';
        let isAnyDue = m1.isDue || m3.isDue || m7.isDue;
        if (m1.isDue) overallText = '⚡ Đến hạn ôn Ngày 1 (+24h)';
        else if (m3.isDue) overallText = '⚡ Đến hạn ôn Ngày 3 (+72h)';
        else if (m7.isDue) overallText = '⚡ Đến hạn ôn Ngày 7 (+168h)';
        else if (item.cycle7Done) overallText = '🏆 Đã hoàn thành trọn vẹn chu kỳ 1-3-7!';

        return {
            lessonId,
            hasStarted: true,
            lastCompletedAt: t0,
            isAnyDue,
            overallText,
            milestones: { cycle1: m1, cycle3: m3, cycle7: m7 }
        };
    }

    // 5. Phát âm thanh chuông melodic thanh thoát (Web Audio API)
    function playChime() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            // Hợp âm Đô trưởng (C5 - E5 - G5) nhẹ nhàng, dễ chịu
            const notes = [523.25, 659.25, 783.99];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
                
                gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
                gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.12 + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.45);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(ctx.currentTime + idx * 0.12);
                osc.stop(ctx.currentTime + idx * 0.12 + 0.5);
            });
        } catch (e) {}
    }

    // 6. Hiển thị Toast thông báo trực tiếp trên giao diện web (In-App Toast)
    function showInAppToast(title, message, actionText, actionCallback) {
        // Tuyệt đối không hiển thị popup toast nếu đang nhúng trong iframe (để tránh đè/lặp giao diện)
        if (isEmbedded) return;

        let container = document.getElementById('loci-toast-container');
        if (container && container.children.length >= 1) {
            // Giới hạn tối đa 1 toast tại một thời điểm, tránh spam che khuất màn hình
            return;
        }
        if (!container) {
            container = document.createElement('div');
            container.id = 'loci-toast-container';
            Object.assign(container.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '99999',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '380px',
                width: 'calc(100vw - 40px)',
                pointerEvents: 'none'
            });
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'loci-toast-item';
        Object.assign(toast.style, {
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '2px solid #6366f1',
            borderRadius: '16px',
            padding: '16px 18px',
            boxShadow: '0 12px 30px rgba(79, 70, 229, 0.25)',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontFamily: "'Outfit', sans-serif",
            animation: 'slideInRight 0.3s ease forwards'
        });

        toast.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:800; font-size:14.5px; color:#4f46e5; display:flex; align-items:center; gap:6px;">
                    <span>⏰</span> ${title}
                </div>
                <button class="toast-close" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer; padding:2px;">✕</button>
            </div>
            <div style="font-size:13px; color:#334155; line-height:1.45;">
                ${message}
            </div>
            ${actionText ? `
            <div style="display:flex; justify-content:flex-end; margin-top:4px;">
                <button class="toast-action" style="padding:6px 14px; border-radius:99px; background:#4f46e5; color:#fff; border:none; font-size:12.5px; font-weight:700; cursor:pointer; transition:all 0.2s;">
                    ${actionText}
                </button>
            </div>` : ''}
        `;

        container.appendChild(toast);

        toast.querySelector('.toast-close').onclick = () => toast.remove();
        if (actionText && actionCallback) {
            toast.querySelector('.toast-action').onclick = () => {
                actionCallback();
                toast.remove();
            };
        }

        // Tự biến mất sau 8 giây
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.4s ease';
                setTimeout(() => toast.remove(), 400);
            }
        }, 8000);
    }

    // 7. Kích hoạt thông báo nhắc hẹn
    function triggerWebReminder(title, message, options = {}) {
        // Chỉ trang cấp cao nhất (top window) mới phát chuông và thông báo, iframe không phát
        if (isEmbedded) return;

        const settings = getSettings();
        if (!settings.enabled) return;

        // Âm thanh chuông
        if (settings.sound) {
            playChime();
        }

        // Web Notification (nếu đã cấp quyền và là top window)
        if (window.Notification && Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body: message,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏛️</text></svg>'
                });
            } catch (e) {}
        }

        // In-App Toast
        showInAppToast(title, message, options.actionText || 'Ôn tập ngay', options.onAction || (() => {
            if (typeof window.switchPortalTab === 'function') {
                window.switchPortalTab('review');
                const appFrame = document.getElementById('app-frame');
                if (appFrame && options.lessonId) {
                    appFrame.src = `review.html?embed=1&lesson=${options.lessonId}`;
                }
            } else if (options.lessonId && typeof window.selectLessonTab === 'function') {
                window.selectLessonTab(options.lessonId);
            } else if (options.lessonId && window.location.pathname.includes('review.html')) {
                window.location.search = `?lesson=${options.lessonId}`;
            } else {
                window.location.href = 'review.html' + (options.lessonId ? `?lesson=${options.lessonId}` : '');
            }
        }));
    }

    // 8. Trình quét kiểm tra hẹn giờ nền (Chỉ chạy ở trang cha, không chạy trong iframe)
    function checkReminders() {
        if (isEmbedded) return;

        const settings = getSettings();
        if (!settings.enabled) return;

        // Nếu người dùng đang xem trang ôn tập (review tab hoặc review.html) thì không hiện popup làm phiền
        if (typeof document !== 'undefined') {
            const activeNav = document.querySelector('.sidebar .nav-item.active');
            if (activeNav && activeNav.dataset.tab === 'review') return;
            if (window.location.pathname.includes('review.html')) return;
        }

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${hours}:${minutes}`;
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // 1. Kiểm tra giờ hẹn hàng ngày
        if (currentTimeStr === settings.time && settings.lastNotifiedDate !== todayStr) {
            settings.lastNotifiedDate = todayStr;
            saveSettings(settings);

            triggerWebReminder(
                '🏛️ Loci Edu - Đến giờ ôn tập hôm nay!',
                `Đã đến giờ nhắc học (${settings.time}) bạn đã hẹn. Hãy dành 5 phút củng cố trí nhớ không gian nhé!`,
                { actionText: 'Vào ôn ngay' }
            );
            return;
        }

        // 2. Kiểm tra chu kỳ 1-3-7 thông minh (Không lặp vô tận, gom các bài cùng đến hạn)
        if (settings.notify137) {
            const lessons = ['bai_6', 'bai_7', 'bai_8'];
            const lessonNames = {
                bai_6: 'Bài 6 (CM tháng Tám 1945)',
                bai_7: 'Bài 7 (Kháng chiến chống Pháp)',
                bai_8: 'Bài 8 (Kháng chiến chống Mỹ)'
            };

            if (!settings.notifiedLessons) settings.notifiedLessons = {};
            if (!settings.notifiedLessons[todayStr]) settings.notifiedLessons[todayStr] = {};

            const dueLessons = [];
            for (const lid of lessons) {
                const stat = getLessonCycleStatus(lid);
                if (stat && stat.isAnyDue) {
                    if (!settings.notifiedLessons[todayStr][lid]) {
                        dueLessons.push({ id: lid, name: lessonNames[lid], stat });
                    }
                }
            }

            if (dueLessons.length > 0) {
                // Đánh dấu tất cả bài này đã được nhắc hôm nay
                dueLessons.forEach(d => {
                    settings.notifiedLessons[todayStr][d.id] = Date.now();
                });
                saveSettings(settings);

                // Ghi nhận chu kỳ vào bộ nhớ, không tự động bung popup đập vào màn hình người học
                // Người học có thể xem trạng thái trực tiếp trên thanh lộ trình 1-3-7 của trang Tổng quan
                console.log('📈 [Loci 1-3-7] Đã kiểm tra chu kỳ ngày hôm nay:', dueLessons.map(d => d.id));
            }
        }
    }

    // Khởi động vòng lặp kiểm tra (chỉ kích hoạt ở cửa sổ chính, không kích hoạt trong iframe)
    if (!isEmbedded) {
        setInterval(checkReminders, 60000);
        setTimeout(checkReminders, 2500);
    }

    // 9. RENDER GIAO DIỆN TIMELINE 1-3-7
    function renderTimelineWidget(lessonId) {
        const stat = getLessonCycleStatus(lessonId);
        const m = stat.milestones;

        return `
        <div class="cycle-137-widget">
            <div class="cycle-137-head">
                <div class="cycle-137-title">
                    <span>📈</span> Chu kỳ Ôn tập Ngắt quãng 1-3-7 (Ebbinghaus)
                </div>
                <div class="cycle-137-status-badge ${stat.isAnyDue ? 'is-due' : ''}">
                    ${stat.overallText}
                </div>
            </div>

            <div class="cycle-137-steps">
                <!-- MỐC 1: NGÀY 1 (+24H) -->
                <div class="cycle-step-card ${m.cycle1.status}">
                    <div class="step-num-pill">Mốc 1</div>
                    <div class="step-label">${m.cycle1.label}</div>
                    <div class="step-desc">${m.cycle1.desc}</div>
                    <div class="step-state">${m.cycle1.text}</div>
                </div>

                <div class="cycle-arrow">➔</div>

                <!-- MỐC 2: NGÀY 3 (+72H) -->
                <div class="cycle-step-card ${m.cycle3.status}">
                    <div class="step-num-pill">Mốc 2</div>
                    <div class="step-label">${m.cycle3.label}</div>
                    <div class="step-desc">${m.cycle3.desc}</div>
                    <div class="step-state">${m.cycle3.text}</div>
                </div>

                <div class="cycle-arrow">➔</div>

                <!-- MỐC 3: NGÀY 7 (+168H) -->
                <div class="cycle-step-card ${m.cycle7.status}">
                    <div class="step-num-pill">Mốc 3</div>
                    <div class="step-label">${m.cycle7.label}</div>
                    <div class="step-desc">${m.cycle7.desc}</div>
                    <div class="step-state">${m.cycle7.text}</div>
                </div>
            </div>
        </div>
        `;
    }

    // 10. MODAL CÀI ĐẶT NHẮC HẸN TRÊN WEB
    function openReminderModal() {
        const existing = document.getElementById('loci-reminder-modal');
        if (existing) existing.remove();

        const settings = getSettings();
        const hasNotiPermission = window.Notification && Notification.permission === 'granted';

        const lessons = [
            { id: 'bai_6', title: 'Bài 6: CM tháng Tám 1945' },
            { id: 'bai_7', title: 'Bài 7: Kháng chiến chống Pháp' },
            { id: 'bai_8', title: 'Bài 8: Kháng chiến chống Mỹ' }
        ];

        const modal = document.createElement('div');
        modal.id = 'loci-reminder-modal';
        modal.className = 'pause-modal-overlay';
        modal.innerHTML = `
            <div class="pause-modal-box" style="max-width: 480px; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 26px;">⏰</span>
                        <div>
                            <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0;">Đặt nhắc hẹn ôn tập trên Web</h3>
                            <div style="font-size: 12.5px; color: #64748b;">Trang web sẽ tự phát chuông và nhắc bạn học đúng giờ</div>
                        </div>
                    </div>
                    <button id="modal-close-btn" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer;">✕</button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <!-- BẬT/TẮT NHẮC HẸN -->
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0;">
                        <div>
                            <div style="font-size: 14px; font-weight: 700; color: #1e293b;">Bật nhắc hẹn trên Web</div>
                            <div style="font-size: 12px; color: #64748b;">Nhận thông báo khi tab mở hoặc chạy nền</div>
                        </div>
                        <input type="checkbox" id="cfg-reminder-enabled" ${settings.enabled ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #4f46e5; cursor: pointer;">
                    </div>

                    <!-- GIỜ NHẮC HÀNG NGÀY -->
                    <div style="background: #f8fafc; padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0;">
                        <label for="cfg-reminder-time" style="display: block; font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">
                            🔔 Giờ nhắc học tập mỗi ngày:
                        </label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="time" id="cfg-reminder-time" value="${settings.time}" style="font-size: 18px; font-weight: 800; padding: 8px 14px; border-radius: 10px; border: 2px solid #cbd5e1; outline: none; font-family: inherit; color: #4f46e5;">
                            <span style="font-size: 12.5px; color: #64748b;">Mặc định 20:00 tối mỗi ngày</span>
                        </div>
                    </div>

                    <!-- TÙY CHỌN 1-3-7 VÀ ÂM THANH -->
                    <div style="display: flex; flex-direction: column; gap: 8px; padding: 0 4px;">
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 600; color: #334155; cursor: pointer;">
                            <input type="checkbox" id="cfg-reminder-137" ${settings.notify137 ? 'checked' : ''} style="accent-color: #4f46e5;">
                            <span>📈 Tự động nhắc khi có bài đến hạn chu kỳ 1-3-7</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 600; color: #334155; cursor: pointer;">
                            <input type="checkbox" id="cfg-reminder-sound" ${settings.sound ? 'checked' : ''} style="accent-color: #4f46e5;">
                            <span>🔊 Phát chuông âm thanh nhẹ nhàng khi nhắc</span>
                        </label>
                    </div>

                    <!-- LỘ TRÌNH 1-3-7 HIỆN TẠI 3 BÀI -->
                    <div style="background: #f1f5f9; padding: 12px 14px; border-radius: 14px; border: 1px solid #e2e8f0;">
                        <div style="font-size: 12.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
                            📋 Tình trạng chu kỳ 1-3-7 hiện tại:
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            ${lessons.map(l => {
                                const st = getLessonCycleStatus(l.id);
                                return `
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; background: #fff; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                    <span style="font-weight: 700; color: #1e293b;">${l.title}</span>
                                    <span style="font-weight: 700; color: ${st.isAnyDue ? '#dc2626' : '#059669'};">${st.overallText}</span>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- NÚT THỬ THÔNG BÁO VÀ CHUÔNG NGAY -->
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button id="btn-test-notification" style="flex: 1; padding: 10px 14px; border-radius: 12px; background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;">
                            <span>🔔</span> Thử chuông & thông báo ngay
                        </button>
                    </div>

                    <!-- NÚT LƯU CÀI ĐẶT -->
                    <div style="display: flex; gap: 10px; margin-top: 6px;">
                        <button id="btn-save-settings" class="btn-modal-action pri" style="flex: 2; padding: 12px;">
                            💾 Lưu cài đặt nhắc hẹn
                        </button>
                        <button id="btn-cancel-settings" class="btn-modal-action ghost" style="flex: 1;">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Đóng modal
        const closeModal = () => modal.remove();
        document.getElementById('modal-close-btn').onclick = closeModal;
        document.getElementById('btn-cancel-settings').onclick = closeModal;

        // Thử thông báo
        document.getElementById('btn-test-notification').onclick = async () => {
            if (window.Notification && Notification.permission !== 'granted') {
                try {
                    await Notification.requestPermission();
                } catch (e) {}
            }
            playChime();
            triggerWebReminder(
                '🏛️ Loci Edu - Thử nghiệm nhắc hẹn thành công!',
                `Web đã ghi nhận giờ nhắc ${document.getElementById('cfg-reminder-time').value} và chu kỳ 1-3-7. Thông báo và âm thanh hoạt động chuẩn xác!`,
                { actionText: 'Đã hiểu' }
            );
        };

        // Lưu cài đặt
        document.getElementById('btn-save-settings').onclick = async () => {
            const enabled = document.getElementById('cfg-reminder-enabled').checked;
            const time = document.getElementById('cfg-reminder-time').value || '20:00';
            const notify137 = document.getElementById('cfg-reminder-137').checked;
            const sound = document.getElementById('cfg-reminder-sound').checked;

            if (enabled && window.Notification && Notification.permission !== 'granted') {
                try {
                    await Notification.requestPermission();
                } catch (e) {}
            }

            saveSettings({ enabled, time, notify137, sound });
            
            // Cập nhật text trên pill header (nếu có)
            const pillTime = document.getElementById('header-reminder-time');
            if (pillTime) pillTime.textContent = enabled ? time : 'Đang tắt';

            closeModal();
            showInAppToast('Đã lưu thành công!', `Web sẽ tự động nhắc bạn lúc ${time} và khi đến mốc 1-3-7.`, 'Đóng');
        };
    }

    // Xuất khẩu đối tượng
    window.LociReminder137 = {
        getCycleData,
        recordLessonCompleted,
        getLessonCycleStatus,
        getSettings,
        saveSettings,
        playChime,
        triggerWebReminder,
        checkReminders,
        renderTimelineWidget,
        openReminderModal
    };

})(window);
