/* LOCI Spatial Anchor — gắn mốc kiến thức vào không gian thật.
   Hai cách khóa không gian:
   1) Nhận dạng thị giác (mặc định): chụp khung cảnh lúc đặt mốc, lần sau mở app
      chỉ cần chiếu camera về khu vực đó — không cần dán mã QR.
   2) Mã neo QR (tuỳ chọn): khóa chính xác tuyệt đối khi cần hiệu chỉnh lại.
   Phụ thuộc: app/spatial_math.js, app/visual_recall.js, app/jsqr.min.js, app/qrcode.min.js
   Dữ liệu lưu trong space.spatial = { v, frameId, calib, anchors } (đồng bộ cùng không gian 360). */
(function () {
    'use strict';

    const VERSION = '1.1.0';
    if (window.LociSpatial && window.LociSpatial.__version === VERSION) return;

    const M = window.LociSpatialMath;
    if (!M) { console.warn('[LociSpatial] thiếu spatial_math.js'); return; }

    const QR_PREFIX = 'LOCI1';
    const SCAN_MAX_WIDTH = 720;
    const SCAN_INTERVAL_MS = 180;
    const STEP_CM_DEFAULT = 72;
    const PLACE_MIN_CM = 50;
    const PLACE_MAX_CM = 800;
    const PLACE_DEFAULT_CM = 200;
    const FOCAL_HFOV_DEFAULT = 64;
    const VISUAL_INTERVAL_MS = 1000;
    const VISUAL_REFS_PER_TRY = 2;
    const VISUAL_MAX_REFS = 10;
    const VISUAL_MIN_INLIERS = 12;
    const VISUAL_MIN_INLIERS_TRACKING = 16;
    const VISUAL_MAX_RMS = 4.6;
    const R_UPRIGHT = [[1, 0, 0], [0, 0, 1], [0, -1, 0]];
    const R_CAM2DEV = [[1, 0, 0], [0, -1, 0], [0, 0, -1]];

    const S = {
        open: false,
        bridge: null,
        space: null,
        spatial: null,
        root: null,
        video: null,
        pinsBox: null,
        scanCanvas: document.createElement('canvas'),
        stream: null,
        streamIsOwn: false,
        pinned: {},
        pinEls: {},
        tab: 'anchors',
        selectedId: null,
        placing: null,
        distanceCm: PLACE_DEFAULT_CM,
        qrSizeCm: 15,
        calibDistanceCm: 150,
        pose: null,
        poseLock: null,
        poseLockYaw: 0,
        poseLockSource: null,
        yawOffset: null,
        lastLockAt: 0,
        drift: [0, 0, 0],
        sensor: { last: null, at: 0 },
        pdr: { on: true, steps: 0, baseline: 9.81, wasBelow: true, lastPeak: 0 },
        stepCm: STEP_CM_DEFAULT,
        scanTimer: null,
        visualTimer: null,
        rafId: 0,
        lastStatus: '',
        lastWarnAt: 0,
        modal: null,
        detailId: null,
        sensorPermissionAsked: false,
        scanMisses: 0,
        lastQrAt: 0,
        calibSaveAt: 0,
        focalOverride: 0,
        aimUv: null,
        tapStart: null,
        visual: {
            refs: [],
            ready: false,
            cursor: 0,
            lastTry: 0,
            busy: false,
            lastOk: 0,
            lastInliers: 0,
            focalNorm: 0,
            lastCaptureAt: 0,
            lastCapturePos: null,
            lockedOnce: false
        }
    };

    /* ---------------- helpers ---------------- */
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const $ = id => document.getElementById(id);

    function ensureSpatial(space) {
        if (!space) return null;
        if (!space.spatial || space.spatial.v !== 1) {
            const old = space.spatial || {};
            space.spatial = {
                v: 1,
                frameId: old.frameId || null,
                calib: old.calib || null,
                anchors: old.anchors || {}
            };
        }
        if (!space.spatial.anchors) space.spatial.anchors = {};
        return space.spatial;
    }

    function focalPx() {
        const vw = (S.video && S.video.videoWidth) || 0;
        const calib = S.spatial && S.spatial.calib;
        if (calib && calib.focalNorm > 0) return calib.focalNorm * vw;
        if (S.focalOverride > 0) return S.focalOverride * vw;
        if (S.visual.focalNorm > 0) return S.visual.focalNorm * vw;
        return 0.5 * vw / Math.tan((FOCAL_HFOV_DEFAULT * M.D2R) / 2);
    }

    function currentFocalNorm() {
        const vw = (S.video && S.video.videoWidth) || 0;
        if (vw > 0) return focalPx() / vw;
        return 0.5 / Math.tan((FOCAL_HFOV_DEFAULT * M.D2R) / 2);
    }

    function visualApi() {
        return (typeof window !== 'undefined' && window.LociVisualRecall) || null;
    }

    function camYawOf(R) {
        return Math.atan2(R[0][2], R[1][2]);
    }

    function anchorList() {
        try {
            return (S.bridge && S.bridge.getAnchors && S.bridge.getAnchors()) || [];
        } catch (e) { return []; }
    }

    function anchorTitle(id) {
        const a = anchorList().find(x => x.id === id);
        return a ? a.title : 'Mốc';
    }

    function toast(t) {
        const el = $('lsa-toast');
        if (!el) return;
        el.textContent = t;
        el.classList.add('on');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => el.classList.remove('on'), 2400);
    }

    function setStatus(main, sub) {
        const a = $('lsa-status');
        if (a) a.textContent = main;
        const b = $('lsa-substatus');
        if (b) b.textContent = sub || '';
        updateCalibBadge();
    }

    /* ---------------- UI skeleton ---------------- */
    const CSS = `
.lsa-root{position:fixed;inset:0;z-index:820;background:#05070d;display:none;overflow:hidden;font-family:'Outfit','Plus Jakarta Sans',system-ui,sans-serif;color:#f8fafc;touch-action:none}
.lsa-root.on{display:block}
#lsa-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000;z-index:0}
.lsa-vignette{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 40%,transparent 55%,rgba(0,0,0,.55) 100%);pointer-events:none;z-index:1}
.lsa-top{position:absolute;top:0;left:0;right:0;z-index:6;display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top, 12px) + 10px) 14px 26px;background:linear-gradient(180deg,rgba(3,7,18,.86),rgba(3,7,18,0))}
.lsa-title{flex:1;min-width:0}
.lsa-title b{display:block;font-size:14.5px;font-weight:800;letter-spacing:.2px}
.lsa-title span{display:block;font-size:11.5px;color:#93c5fd;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lsa-sub{font-size:11px;color:#94a3b8;margin-top:1px}
.lsa-icon-btn{width:38px;height:38px;border-radius:14px;border:1px solid rgba(148,163,184,.35);background:rgba(15,23,42,.62);color:#f8fafc;font-size:16px;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(10px)}
.lsa-icon-btn:active{transform:scale(.94)}
.lsa-badge{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:99px;border:1px solid rgba(148,163,184,.35);background:rgba(15,23,42,.55);color:#cbd5e1}
.lsa-badge.ok{border-color:rgba(16,185,129,.55);color:#6ee7b7;background:rgba(6,78,59,.5)}
.lsa-badge.warn{border-color:rgba(245,158,11,.55);color:#fcd34d;background:rgba(120,53,15,.4)}
.lsa-pins{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden}
.lsa-pin{position:absolute;left:0;top:0;display:flex;flex-direction:column;align-items:center;gap:5px;pointer-events:auto;cursor:pointer;will-change:transform,opacity;transition:opacity .18s}
.lsa-pin .dot{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:15px;color:#fff;background:linear-gradient(135deg,#0ea5e9,#4f46e5);border:2.5px solid #fff;box-shadow:0 8px 22px rgba(2,132,199,.55),0 0 0 6px rgba(56,189,248,.16);animation:lsaPulse 2.4s ease-out infinite}
.lsa-pin .lab{max-width:170px;font-size:11px;font-weight:700;line-height:1.25;text-align:center;padding:4px 8px;border-radius:9px;background:rgba(2,6,23,.78);border:1px solid rgba(56,189,248,.35);backdrop-filter:blur(8px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lsa-pin .meta{font-size:10px;color:#7dd3fc;font-weight:600}
.lsa-pin.sel .dot{background:linear-gradient(135deg,#10b981,#059669);animation:none;box-shadow:0 0 0 10px rgba(16,185,129,.18),0 8px 24px rgba(5,150,105,.6)}
.lsa-pin.ghost{opacity:.75}
.lsa-pin.ghost .dot{background:rgba(15,23,42,.72);border:2.5px dashed #38bdf8;box-shadow:none;animation:none}
.lsa-pin.edge .dot{width:34px;height:34px;font-size:13px;animation:none}
.lsa-pin.edge .lab{display:none}
@keyframes lsaPulse{0%{box-shadow:0 8px 22px rgba(2,132,199,.55),0 0 0 0 rgba(56,189,248,.5)}70%{box-shadow:0 8px 22px rgba(2,132,199,.55),0 0 0 18px rgba(56,189,248,0)}100%{box-shadow:0 8px 22px rgba(2,132,199,.55),0 0 0 0 rgba(56,189,248,0)}}
.lsa-reticle{position:absolute;left:50%;top:50%;width:74px;height:74px;transform:translate(-50%,-50%);z-index:5;pointer-events:none;display:none}
.lsa-reticle.on{display:block}
.lsa-reticle i{position:absolute;background:rgba(255,255,255,.85);box-shadow:0 0 8px rgba(56,189,248,.8)}
.lsa-reticle i:nth-child(1){left:50%;top:0;width:2px;height:18px;transform:translateX(-50%)}
.lsa-reticle i:nth-child(2){left:50%;bottom:0;width:2px;height:18px;transform:translateX(-50%)}
.lsa-reticle i:nth-child(3){top:50%;left:0;height:2px;width:18px;transform:translateY(-50%)}
.lsa-reticle i:nth-child(4){top:50%;right:0;height:2px;width:18px;transform:translateY(-50%)}
.lsa-reticle i:nth-child(5){left:50%;top:50%;width:6px;height:6px;border-radius:50%;transform:translate(-50%,-50%);background:#38bdf8}
.lsa-dist-chip{position:absolute;left:50%;top:calc(50% + 52px);transform:translateX(-50%);font-size:12px;font-weight:800;color:#e0f2fe;background:rgba(2,6,23,.72);border:1px solid rgba(56,189,248,.4);border-radius:99px;padding:4px 12px;white-space:nowrap}
.lsa-sheet{position:absolute;left:0;right:0;bottom:0;z-index:7;background:rgba(8,15,30,.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid rgba(148,163,184,.22);border-radius:22px 22px 0 0;box-shadow:0 -18px 40px rgba(0,0,0,.45);padding:8px 14px calc(env(safe-area-inset-bottom, 10px) + 12px);max-height:46vh;overflow:auto;transition:max-height .25s ease;touch-action:pan-y}
.lsa-sheet.collapsed{max-height:64px;overflow:hidden}
.lsa-grab{width:64px;height:22px;margin:0 auto 2px;position:relative;touch-action:none;cursor:grab}
.lsa-grab::before{content:'';position:absolute;left:12px;right:12px;top:9px;height:4px;border-radius:99px;background:rgba(148,163,184,.45)}
.lsa-tabs{display:flex;gap:6px;margin-bottom:10px}
.lsa-tabs button{flex:1;padding:9px 6px;border-radius:12px;border:1px solid rgba(148,163,184,.22);background:rgba(30,41,59,.45);color:#cbd5e1;font-size:12px;font-weight:700;cursor:pointer}
.lsa-tabs button.on{background:linear-gradient(135deg,rgba(2,132,199,.9),rgba(79,70,229,.9));color:#fff;border-color:transparent;box-shadow:0 6px 18px rgba(2,132,199,.35)}
.lsa-hint{font-size:11.5px;line-height:1.5;color:#94a3b8;margin:0 0 10px}
.lsa-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:13px;border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.55);margin-bottom:7px;cursor:pointer}
.lsa-item.sel{border-color:rgba(56,189,248,.7);background:rgba(8,47,73,.6);box-shadow:0 0 0 1px rgba(56,189,248,.25) inset}
.lsa-item .n{width:28px;height:28px;flex:0 0 28px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;background:rgba(2,132,199,.3);border:1px solid rgba(56,189,248,.45)}
.lsa-item.armed .n{background:linear-gradient(135deg,#10b981,#059669);border-color:transparent}
.lsa-item .t{flex:1;min-width:0;font-size:12.5px;font-weight:700;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lsa-item .t small{display:block;font-size:10.5px;font-weight:600;color:#94a3b8;margin-top:2px}
.lsa-item .st{font-size:10px;font-weight:800;padding:3px 7px;border-radius:99px;background:rgba(148,163,184,.16);color:#cbd5e1;white-space:nowrap}
.lsa-item.armed .st{background:rgba(16,185,129,.2);color:#6ee7b7}
.lsa-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:none;border-radius:13px;padding:11px 14px;font-size:12.5px;font-weight:800;cursor:pointer;font-family:inherit}
.lsa-btn:active{transform:scale(.97)}
.lsa-btn.pri{background:linear-gradient(135deg,#0284c7,#4f46e5);color:#fff;box-shadow:0 8px 20px rgba(2,132,199,.35)}
.lsa-btn.ok{background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 8px 20px rgba(5,150,105,.3)}
.lsa-btn.ghost{background:rgba(30,41,59,.6);color:#e2e8f0;border:1px solid rgba(148,163,184,.3)}
.lsa-btn.danger{background:rgba(127,29,29,.5);color:#fecaca;border:1px solid rgba(248,113,113,.4)}
.lsa-btn[disabled]{opacity:.45;pointer-events:none}
.lsa-row{display:flex;gap:8px;margin-top:8px}
.lsa-row .lsa-btn{flex:1}
.lsa-field{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;border-radius:12px;background:rgba(15,23,42,.55);border:1px solid rgba(148,163,184,.16);margin-bottom:8px;font-size:12px;color:#cbd5e1}
.lsa-field input[type=number]{width:86px;padding:7px 8px;border-radius:9px;border:1px solid rgba(148,163,184,.3);background:rgba(2,6,23,.7);color:#f8fafc;font-family:inherit;font-size:12px;text-align:right}
.lsa-field input[type=range]{flex:1;accent-color:#38bdf8}
.lsa-range{display:block;margin-top:10px}
.lsa-range-label{display:flex;justify-content:space-between;font-size:11.5px;color:#7dd3fc;font-weight:700;margin-bottom:2px}
.lsa-card{position:absolute;left:12px;right:12px;bottom:calc(46vh + 14px);z-index:8;background:rgba(8,15,30,.94);border:1px solid rgba(56,189,248,.3);border-radius:18px;padding:14px;box-shadow:0 18px 44px rgba(0,0,0,.5);display:none;max-height:52vh;overflow:auto}
.lsa-card.on{display:block}
.lsa-card h3{margin:0 0 6px;font-size:15px;font-weight:800}
.lsa-card p{margin:0 0 8px;font-size:12px;line-height:1.5;color:#cbd5e1}
.lsa-card ul{margin:0 0 8px;padding-left:18px;font-size:12px;line-height:1.5;color:#cbd5e1}
.lsa-card .x{position:absolute;right:10px;top:10px;width:28px;height:28px;border-radius:50%;border:none;background:rgba(30,41,59,.7);color:#e2e8f0;cursor:pointer}
.lsa-toast{position:absolute;left:50%;bottom:calc(46vh + 18px);transform:translateX(-50%) translateY(8px);z-index:9;background:rgba(2,6,23,.92);border:1px solid rgba(56,189,248,.4);color:#e0f2fe;font-size:12px;font-weight:700;padding:9px 14px;border-radius:99px;opacity:0;pointer-events:none;transition:all .22s;max-width:88vw;text-align:center}
.lsa-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
.lsa-modal{position:absolute;inset:0;z-index:10;background:rgba(2,6,23,.82);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:18px}
.lsa-modal.on{display:flex}
.lsa-modal .box{width:100%;max-width:420px;background:#0b1220;border:1px solid rgba(148,163,184,.25);border-radius:20px;padding:16px;max-height:88vh;overflow:auto}
.lsa-modal h3{margin:0 0 8px;font-size:16px;font-weight:800}
.lsa-modal p{font-size:12px;color:#94a3b8;line-height:1.5;margin:0 0 12px}
.lsa-qr-wrap{background:#fff;border-radius:14px;padding:10px;display:grid;place-items:center;margin-bottom:12px}
.lsa-qr-wrap canvas{width:100%;max-width:260px;height:auto;display:block}
.lsa-help-list{font-size:12px;line-height:1.6;color:#cbd5e1;margin:0;padding-left:18px}
.lsa-fallback{position:absolute;left:14px;right:14px;top:50%;transform:translateY(-50%);z-index:9;background:rgba(8,15,30,.95);border:1px solid rgba(148,163,184,.28);border-radius:20px;padding:18px;display:none}
.lsa-fallback.on{display:block}
`;

    function buildDom() {
        if (S.root) return;
        const style = document.createElement('style');
        style.id = 'lsa-style';
        style.textContent = CSS;
        document.head.appendChild(style);

        const root = document.createElement('div');
        root.id = 'lsa-root';
        root.className = 'lsa-root';
        root.innerHTML = `
            <video id="lsa-video" playsinline autoplay muted></video>
            <div class="lsa-vignette"></div>
            <div class="lsa-pins" id="lsa-pins">
                <div class="lsa-pin ghost" id="lsa-ghost-pin" style="display:none">
                    <div class="dot">＋</div><div class="lab">Vị trí sắp thả</div><div class="meta"></div>
                </div>
            </div>
            <div class="lsa-reticle" id="lsa-reticle"><i></i><i></i><i></i><i></i><i></i>
                <div class="lsa-dist-chip" id="lsa-dist-chip">2.0 m</div>
            </div>
            <div class="lsa-top">
                <button class="lsa-icon-btn" id="lsa-close" title="Đóng AR">✕</button>
                <div class="lsa-title">
                    <b>Mốc không gian thật</b>
                    <span id="lsa-status">Đang khởi động camera…</span>
                    <div class="lsa-sub" id="lsa-substatus"></div>
                </div>
                <span class="lsa-badge" id="lsa-lock-badge">CHƯA KHÓA</span>
                <button class="lsa-icon-btn" id="lsa-help">?</button>
            </div>
            <div class="lsa-sheet" id="lsa-sheet">
                <div class="lsa-grab" id="lsa-grab"></div>
                <div class="lsa-tabs">
                    <button data-tab="anchors" class="on" id="lsa-tab-anchors">📍 Mốc</button>
                    <button data-tab="calib" id="lsa-tab-calib">🎯 Mã neo</button>
                    <button data-tab="settings" id="lsa-tab-settings">⚙️</button>
                </div>
                <div id="lsa-body"></div>
            </div>
            <div class="lsa-card" id="lsa-detail"></div>
            <div class="lsa-toast" id="lsa-toast"></div>
            <div class="lsa-fallback" id="lsa-fallback"></div>
            <div class="lsa-modal" id="lsa-qr-modal">
                <div class="box">
                    <h3>🎯 Tạo mã neo cho không gian</h3>
                    <p>In tờ mã này và dán lên tường (cao ngang ngực). Đây là "mỏ neo" để lần sau mở app, camera nhận ra đúng căn phòng và đặt mốc về đúng chỗ.</p>
                    <div class="lsa-qr-wrap"><canvas id="lsa-qr-canvas" width="1024" height="1024"></canvas></div>
                    <div class="lsa-field"><span>Kích thước in</span>
                        <select id="lsa-qr-size" style="padding:7px 10px;border-radius:9px;background:rgba(2,6,23,.7);color:#f8fafc;border:1px solid rgba(148,163,184,.3);font-family:inherit">
                            <option value="10">10 × 10 cm</option>
                            <option value="15" selected>15 × 15 cm</option>
                            <option value="20">20 × 20 cm</option>
                            <option value="25">25 × 25 cm</option>
                        </select>
                    </div>
                    <div class="lsa-row">
                        <button class="lsa-btn ghost" id="lsa-qr-download">⬇ Tải PNG</button>
                        <button class="lsa-btn pri" id="lsa-qr-print">🖨 In mã neo</button>
                    </div>
                    <div class="lsa-row">
                        <button class="lsa-btn ghost" id="lsa-qr-close" style="flex:1">Đóng</button>
                    </div>
                </div>
            </div>
            <div class="lsa-modal" id="lsa-help-modal">
                <div class="box">
                    <h3>Cách dùng mốc không gian thật</h3>
                    <ol class="lsa-help-list">
                        <li><b>Tạo mã neo</b> (tab Mã neo) → in tờ QR và dán lên tường.</li>
                        <li>Đứng cách mã <b>1,5 m</b>, mở tab Mã neo, nhập khoảng cách thật rồi quét mã. Khi báo "Đã khóa", điện thoại đã định vị được mình trong phòng.</li>
                        <li>Chọn một mốc → ngắm tâm vào đúng vị trí thật → chỉnh khoảng cách → <b>Thả tại tâm ngắm</b>.</li>
                        <li>Lần sau mở lại, chỉ cần quét mã neo: các mốc sẽ hiện lại đúng chỗ như Pokémon GO.</li>
                    </ol>
                    <p style="margin-top:10px">Mẹo: giữ điện thoại dọc, đủ sáng, và quét mã khi đứng gần (0,8–2,5 m) để có sai số nhỏ nhất. Khi mã neo khuất khỏi camera, app chuyển sang bám theo cảm biến chuyển động.</p>
                    <button class="lsa-btn pri" id="lsa-help-close" style="width:100%">Đã hiểu</button>
                </div>
            </div>
        `;
        document.body.appendChild(root);
        S.root = root;
        S.video = $('lsa-video');
        S.pinsBox = $('lsa-pins');

        $('lsa-close').onclick = close;
        $('lsa-help').onclick = () => $('lsa-help-modal').classList.add('on');
        $('lsa-help-close').onclick = () => $('lsa-help-modal').classList.remove('on');
        (function bindSheetSwipe() {
            const grab = $('lsa-grab');
            const sheet = $('lsa-sheet');
            let startY = null, startCollapsed = false, dragged = false;
            grab.addEventListener('pointerdown', e => {
                startY = e.clientY;
                dragged = false;
                startCollapsed = sheet.classList.contains('collapsed');
                sheet.style.transition = 'none';
                try { grab.setPointerCapture(e.pointerId); } catch (_) { }
            });
            grab.addEventListener('pointermove', e => {
                if (startY == null) return;
                const dy = e.clientY - startY;
                if (Math.abs(dy) > 12) dragged = true;
                if (!startCollapsed && dy > 30) sheet.classList.add('collapsed');
                else if (startCollapsed && dy < -26) sheet.classList.remove('collapsed');
            });
            const end = e => {
                if (startY == null) return;
                startY = null;
                sheet.style.transition = '';
                if (!dragged && e.type === 'pointerup') sheet.classList.toggle('collapsed');
            };
            grab.addEventListener('pointerup', end);
            grab.addEventListener('pointercancel', end);
        })();
        root.querySelectorAll('.lsa-tabs button').forEach(b => {
            b.onclick = () => { S.tab = b.dataset.tab; renderSheet(); };
        });
        $('lsa-qr-size').onchange = e => {
            S.qrSizeCm = Number(e.target.value) || 15;
            renderQr();
        };
        $('lsa-qr-download').onclick = downloadQr;
        $('lsa-qr-print').onclick = printQr;
        $('lsa-qr-close').onclick = () => $('lsa-qr-modal').classList.remove('on');
        $('lsa-qr-modal').onclick = e => { if (e.target.id === 'lsa-qr-modal') e.currentTarget.classList.remove('on'); };
        $('lsa-help-modal').onclick = e => { if (e.target.id === 'lsa-help-modal') e.currentTarget.classList.remove('on'); };
    }

    /* ---------------- data / state ---------------- */
    function applyPose(pose, source) {
        if (!pose) return;
        S.pose = { R: pose.R, C: pose.C.slice(), source: source || 'qr' };
    }

    function updateCalibBadge() {
        const badge = $('lsa-lock-badge');
        if (!badge) return;
        const src = S.pose && S.pose.source;
        let label = 'CHƯA KHÓA', cls = '';
        if (S.poseLock || S.pose) {
            if (src === 'qr') { label = 'ĐÃ KHÓA'; cls = 'ok'; }
            else if (src === 'visual') { label = 'NHẬN DIỆN'; cls = 'ok'; }
            else { label = 'CẢM BIẾN'; cls = 'warn'; }
        }
        badge.textContent = label;
        badge.className = 'lsa-badge ' + cls;
    }

    function poseSourceLabel() {
        const src = S.pose && S.pose.source;
        if (src === 'qr') return 'mã neo QR';
        if (src === 'visual') return 'nhận dạng khung cảnh';
        if (src === 'sensor' || src === 'init') return 'cảm biến chuyển động';
        return 'chưa khóa';
    }

    /* ---------------- camera ---------------- */
    async function startCamera(streamOverride) {
        let stream = streamOverride || null;
        if (!stream) {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error(window.isSecureContext === false
                    ? 'Camera chỉ hoạt động trên HTTPS hoặc localhost.'
                    : 'Thiết bị không hỗ trợ camera.');
            }
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            S.streamIsOwn = true;
        }
        S.stream = stream;
        S.video.srcObject = stream;
        try { await S.video.play(); } catch (e) { /* autoplay muted */ }
        await new Promise(resolve => {
            if (S.video.videoWidth) return resolve();
            const done = () => { S.video.removeEventListener('loadedmetadata', done); resolve(); };
            S.video.addEventListener('loadedmetadata', done);
            setTimeout(done, 1800);
        });
        if (!S.video.videoWidth) throw new Error('Không đọc được khung hình camera.');
    }

    function stopCamera() {
        if (S.streamIsOwn && S.stream) {
            S.stream.getTracks().forEach(t => { try { t.stop(); } catch (e) { } });
        }
        S.stream = null;
        S.streamIsOwn = false;
        if (S.video) { try { S.video.srcObject = null; } catch (e) { } }
    }

    /* ---------------- QR ---------------- */
    function parsePayload(text) {
        if (typeof text !== 'string' || !text.startsWith(QR_PREFIX + '|')) return null;
        const parts = text.split('|');
        const id = parts[1];
        const size = parseFloat(parts[2]);
        if (!id || !(size >= 3 && size <= 200)) return null;
        return { spaceId: id, sizeCm: size };
    }

    function drawQrTo(canvas, text, sizePx) {
        if (typeof window.qrcode !== 'function') return false;
        let qr;
        try {
            qr = window.qrcode(0, 'M');
            qr.addData(text);
            qr.make();
        } catch (e) { return false; }
        const count = qr.getModuleCount();
        const margin = 4;
        const cell = Math.floor(sizePx / (count + margin * 2));
        const total = cell * (count + margin * 2);
        const ox = Math.floor((sizePx - total) / 2);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sizePx, sizePx);
        ctx.fillStyle = '#000000';
        for (let r = 0; r < count; r++) {
            for (let c = 0; c < count; c++) {
                if (qr.isDark(r, c)) ctx.fillRect(ox + (c + margin) * cell, ox + (r + margin) * cell, cell, cell);
            }
        }
        return true;
    }

    function qrPayload() {
        return `${QR_PREFIX}|${S.space ? S.space.id : ''}|${S.qrSizeCm}`;
    }

    function renderQr() {
        const canvas = $('lsa-qr-canvas');
        if (!canvas) return;
        const sel = $('lsa-qr-size');
        if (sel && sel.value !== String(S.qrSizeCm)) sel.value = String(S.qrSizeCm);
        if (!drawQrTo(canvas, qrPayload(), 1024)) {
            toast('Không tạo được mã QR (thiếu thư viện).');
        }
    }

    function downloadQr() {
        const canvas = $('lsa-qr-canvas');
        if (!canvas) return;
        const a = document.createElement('a');
        a.download = `loci-anchor-${S.space.id}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
    }

    function printQr() {
        const canvas = $('lsa-qr-canvas');
        if (!canvas) return;
        const src = canvas.toDataURL('image/png');
        const w = window.open('', '_blank');
        if (!w) { toast('Trình duyệt chặn cửa sổ in.'); return; }
        w.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Mã neo LOCI</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;text-align:center;color:#0f172a}
img{width:${S.qrSizeCm}cm;height:${S.qrSizeCm}cm;display:block;margin:18px auto}
p{font-size:12px;line-height:1.6;max-width:520px;margin:8px auto;color:#475569}
h1{font-size:18px;margin:0 0 6px}small{color:#64748b}</style></head><body>
<h1>MÃ NEO KHÔNG GIAN — LOCI</h1>
<p>Dán tờ này lên tường, cao ngang ngực. Khi in, chọn tỉ lệ <b>100%</b> để mã đúng kích thước ${S.qrSizeCm}×${S.qrSizeCm} cm.</p>
<img src="${src}" alt="QR anchor">
<p><b>Không gian:</b> ${esc(S.space.name || 'Không gian 360')}<br>
<b>Mã:</b> ${esc(qrPayload())}</p>
<p><small>Sau khi dán, mở app → tab Mã neo → nhập khoảng cách thật tới mã → quét mã để khóa.</small></p>
<script>setTimeout(()=>window.print(),400)<\/script>
</body></html>`);
        w.document.close();
    }

    /* ---------------- scanning ---------------- */
    function qrSideLengths(c) {
        const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        return [d(c[0], c[1]), d(c[1], c[2]), d(c[2], c[3]), d(c[3], c[0])];
    }

    function scanOnce() {
        if (!S.open || !S.video || !S.video.videoWidth || S.video.readyState < 2) return;
        if (typeof window.jsQR !== 'function') {
            setStatus('Đang tải bộ giải mã QR…', '');
            return;
        }
        const vw = S.video.videoWidth, vh = S.video.videoHeight;
        const scale = Math.min(1, SCAN_MAX_WIDTH / vw);
        const cw = Math.max(1, Math.round(vw * scale));
        const ch = Math.max(1, Math.round(vh * scale));
        const canvas = S.scanCanvas;
        if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        try { ctx.drawImage(S.video, 0, 0, cw, ch); } catch (e) { return; }
        let img;
        try { img = ctx.getImageData(0, 0, cw, ch); } catch (e) { return; }
        const code = window.jsQR(img.data, cw, ch, { inversionAttempts: 'dontInvert' });
        if (!code || !code.location) {
            S.scanMisses++;
            if (S.poseLock && S.scanMisses > 8 && S.pose.source === 'qr') {
                S.pose.source = 'sensor';
                updateCalibBadge();
                setStatus('Đang bám theo cảm biến', 'Đưa camera về phía mã neo để khóa lại chính xác');
            }
            return;
        }
        const parsed = parsePayload(code.data);
        if (!parsed) return;
        if (S.space && parsed.spaceId !== S.space.id) {
            if (performance.now() - S.lastWarnAt > 4000) {
                S.lastWarnAt = performance.now();
                setStatus('Mã neo của không gian khác', 'Hãy dùng đúng tờ mã đã in cho không gian này');
            }
            return;
        }
        const loc = code.location;
        const corners = [loc.topLeftCorner, loc.topRightCorner, loc.bottomRightCorner, loc.bottomLeftCorner]
            .map(p => [p.x / scale, p.y / scale]);
        processQr(parsed, corners, vw, vh);
    }

    function processQr(parsed, corners, vw, vh) {
        const sides = qrSideLengths(corners.map(p => ({ x: p[0], y: p[1] })));
        const widthPx = sides.reduce((a, b) => a + b, 0) / 4;
        if (widthPx < 40) return;

        let focalNorm = S.spatial && S.spatial.calib && S.spatial.calib.focalNorm;
        if (!(focalNorm > 0)) {
            const fEstimated = M.estimateFocalPx(sides, parsed.sizeCm, S.calibDistanceCm);
            if (!(fEstimated > 0)) return;
            focalNorm = fEstimated / vw;
        }
        const f = focalNorm * vw;
        const pose = M.poseFromQRCorners(corners, parsed.sizeCm, f, vw / 2, vh / 2);
        if (!pose) return;
        if (pose.reproj > Math.max(5, widthPx * 0.09)) return;

        const world = M.markerToWorld(pose.R, pose.t);
        const firstLock = !S.poseLock;
        lockPose(world, pose.reproj, parsed, focalNorm, widthPx, firstLock);
        S.scanMisses = 0;
        S.lastQrAt = performance.now();
    }

    function lockPose(world, reproj, parsed, focalNorm, widthPx, firstLock) {
        const wasLocked = !!S.poseLock;
        const oldPose = S.pose;
        const spatial = ensureSpatial(S.space);
        const qrFrameId = 'qr:' + parsed.spaceId + ':' + parsed.sizeCm;
        if (S.spatial.frameId && S.spatial.frameId !== qrFrameId) {
            if (oldPose && oldPose.R && oldPose.C) {
                rebaseAnchors(oldPose.R, oldPose.C, world.R, world.C);
            }
            clearVisualRefs();
        }
        spatial.frameId = qrFrameId;

        S.poseLock = { R: world.R, C: world.C.slice() };
        S.poseLockYaw = camYawOf(world.R);
        S.poseLockSource = 'qr';
        S.drift = [0, 0, 0];
        S.lastLockAt = performance.now();
        applyPose(world, 'qr');
        updateCalibBadge();

        const sy = currentSensorYaw();
        if (sy != null) S.yawOffset = M.normalizeAngle(S.poseLockYaw - sy);

        const quality = reproj < widthPx * 0.03 ? 'tốt' : 'trung bình';
        spatial.calib = {
            payload: `${QR_PREFIX}|${parsed.spaceId}|${parsed.sizeCm}`,
            qrSizeCm: parsed.sizeCm,
            focalNorm,
            focalVideoWidth: S.video.videoWidth,
            reprojPx: Math.round(reproj * 10) / 10,
            quality,
            distanceCm: S.calibDistanceCm,
            at: Date.now()
        };
        setStatus('Đã khóa không gian', `Mã ${parsed.sizeCm} cm · chất lượng ${quality} · quét lại khi mã còn trong khung để bám chính xác`);
        if (!wasLocked) toast('🎯 Đã khóa mã neo — mốc sẽ nằm đúng chỗ thật.');
        saveSoon();
        renderSheet();
        refreshPinVisibility();
        setTimeout(() => {
            if (!S.open || !S.pose || S.pose.source !== 'qr') return;
            captureReference('qr:' + parsed.spaceId);
        }, 1600);
    }

    function saveSoon() {
        const now = performance.now();
        if (now - S.calibSaveAt < 1200) return;
        S.calibSaveAt = now;
        try { S.bridge && S.bridge.persist && S.bridge.persist(); } catch (e) { }
    }

    /* ---------------- visual recall (không cần mã QR) ---------------- */
    function rebaseAnchors(Rold, Cold, Rnew, Cnew) {
        if (!Rold || !Cold || !S.spatial) return 0;
        const Rt = M.transpose(Rold);
        let n = 0;
        for (const id in S.spatial.anchors) {
            const a = S.spatial.anchors[id];
            if (!a || !a.world) continue;
            const rel = [a.world[0] - Cold[0], a.world[1] - Cold[1], a.world[2] - Cold[2]];
            const q = M.mulVec(Rt, rel);
            const w = M.mulVec(Rnew, q);
            a.world = [
                Math.round((w[0] + Cnew[0]) * 10) / 10,
                Math.round((w[1] + Cnew[1]) * 10) / 10,
                Math.round((w[2] + Cnew[2]) * 10) / 10
            ];
            n++;
        }
        return n;
    }

    function clearVisualRefs() {
        const V = visualApi();
        S.visual.refs = [];
        S.visual.cursor = 0;
        S.visual.lockedOnce = false;
        S.visual.lastCapturePos = null;
        S.visual.lastCaptureAt = 0;
        if (V && S.space) {
            try { V.deleteRefs(S.space.id).catch(() => { }); } catch (e) { }
        }
    }

    function captureReference(tag, opts) {
        const V = visualApi();
        if (!V || !S.open || !S.pose || !S.video || S.video.readyState < 2) return Promise.resolve(null);
        let frame = null;
        try { frame = V.captureFrame(S.video, 400); } catch (e) { frame = null; }
        if (!frame || frame.count < 70) return Promise.resolve(null);
        const rec = {
            at: Date.now(),
            tag: tag || 'manual',
            anchorId: (opts && opts.anchorId) || null,
            w: frame.w,
            h: frame.h,
            kps: frame.kps,
            desc: frame.desc,
            pose: { R: S.pose.R.map(r => r.slice()), C: S.pose.C.slice() },
            focalNorm: currentFocalNorm(),
            frameId: (S.spatial && S.spatial.frameId) || null
        };
        S.visual.lastCaptureAt = performance.now();
        S.visual.lastCapturePos = S.pose.C.slice();
        let task;
        try { task = V.saveRef(S.space.id, rec); } catch (e) { task = Promise.resolve(null); }
        return Promise.resolve(task).then(saved => {
            if (!saved) return null;
            if (!opts || opts.replaceTag !== false) {
                S.visual.refs.forEach(r => {
                    if (r.tag === rec.tag && r.id !== saved.id) {
                        try { V.deleteRef(r.id); } catch (e) { }
                    }
                });
                S.visual.refs = S.visual.refs.filter(r => r.tag !== rec.tag);
            }
            S.visual.refs.unshift(saved);
            if (S.visual.refs.length > VISUAL_MAX_REFS) S.visual.refs.length = VISUAL_MAX_REFS;
            if (S.open) renderSheet();
            return saved;
        }).catch(() => null);
    }

    function maybeAutoCapture() {
        if (!S.open || !S.pose || !S.spatial || !S.spatial.frameId) return;
        if (S.visual.busy) return;
        const now = performance.now();
        if (now - S.visual.lastCaptureAt < 12000) return;
        const p = S.visual.lastCapturePos;
        if (p) {
            const d = Math.hypot(S.pose.C[0] - p[0], S.pose.C[1] - p[1], S.pose.C[2] - p[2]);
            if (d < 90) return;
        }
        captureReference('roam:' + Date.now(), { replaceTag: false });
    }

    function applyVisualLock(best, Rlive) {
        const wasSource = S.pose && S.pose.source;
        S.poseLock = { R: Rlive, C: best.ref.pose.C.slice() };
        S.poseLockYaw = camYawOf(Rlive);
        S.poseLockSource = 'visual';
        S.drift = [0, 0, 0];
        if (best.ref.focalNorm > 0) S.visual.focalNorm = best.ref.focalNorm;
        const sy = currentSensorYaw();
        S.yawOffset = sy == null ? null : M.normalizeAngle(S.poseLockYaw - sy);
        applyPose(S.poseLock, 'visual');
        S.lastLockAt = performance.now();
        S.visual.lastOk = S.lastLockAt;
        S.visual.lastInliers = best.m.inliers;
        S.visual.lastCaptureAt = S.lastLockAt;
        S.visual.lastCapturePos = S.pose.C.slice();
        updateCalibBadge();
        renderPins();
        if (!S.visual.lockedOnce || wasSource !== 'visual') {
            S.visual.lockedOnce = true;
            setStatus('Đã nhận ra khung cảnh', `${best.m.inliers} điểm khớp · mốc đang neo theo vị trí đã lưu`);
            toast('🧠 Đã nhận ra khu vực — mốc hiện đúng chỗ đã đặt.');
            renderSheet();
        } else {
            const sub = $('lsa-substatus');
            if (sub) sub.textContent = `Theo dõi thị giác · ${best.m.inliers} điểm khớp`;
        }
    }

    function tryVisualRelocalize(force) {
        if (!S.open || S.visual.busy) return;
        const V = visualApi();
        if (!V || !S.visual.ready || !S.visual.refs.length) return;
        if (!S.video || S.video.readyState < 2 || !S.video.videoWidth) return;
        const now = performance.now();
        if (!force && now - S.visual.lastTry < VISUAL_INTERVAL_MS) return;
        if (S.pose && S.pose.source === 'qr' && now - S.lastQrAt < 2500) return;
        if (S.placing) return;
        if (!force && typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        S.visual.lastTry = now;
        const frameId = S.spatial && S.spatial.frameId;
        const refs = S.visual.refs.filter(r => !frameId || !r.frameId || r.frameId === frameId);
        if (!refs.length) return;

        S.visual.busy = true;
        let frame = null;
        try { frame = V.captureFrame(S.video, 400); } catch (e) { frame = null; }
        if (!frame || frame.count < 60) { S.visual.busy = false; return; }

        const total = Math.min(VISUAL_REFS_PER_TRY, refs.length);
        const start = S.visual.cursor % refs.length;
        let best = null;
        for (let i = 0; i < total; i++) {
            const ref = refs[(start + i) % refs.length];
            let m = null;
            try { m = V.matchFrames(ref, frame); } catch (e) { m = null; }
            if (!m) continue;
            if (!best || m.inliers > best.m.inliers || (m.inliers === best.m.inliers && m.rms < best.m.rms)) {
                best = { ref, m };
            }
        }
        S.visual.cursor = (start + total) % refs.length;
        S.visual.busy = false;
        if (!best) return;

        const minInliers = S.poseLock ? VISUAL_MIN_INLIERS_TRACKING : VISUAL_MIN_INLIERS;
        if (best.m.inliers < minInliers || best.m.rms > VISUAL_MAX_RMS) return;

        const focalNorm = best.ref.focalNorm > 0 ? best.ref.focalNorm : currentFocalNorm();
        const rel = V.rotationFromHomography(best.m.H, focalNorm, best.ref.w, best.ref.h, frame.w, frame.h);
        if (!rel) return;
        const Rlive = M.mul3(best.ref.pose.R, M.transpose(rel));
        if (S.pose) {
            const dYaw = Math.abs(M.normalizeAngle(camYawOf(Rlive) - camYawOf(S.pose.R)));
            if (dYaw > 35 * M.D2R && best.m.inliers < 24) return;
        }
        applyVisualLock(best, Rlive);
    }

    function canInitFrame() {
        if (S.poseLock || S.pose) return false;
        if (S.visual.refs.length) return false;
        if (S.spatial && S.spatial.calib && S.spatial.calib.focalNorm > 0) return false;
        if (S.spatial && S.spatial.anchors && Object.keys(S.spatial.anchors).length) return false;
        return true;
    }

    function initFromSensor(silent) {
        if (!S.spatial || S.poseLock) return false;
        if (!S.spatial.frameId) S.spatial.frameId = 'init:' + Date.now().toString(36);
        let R = R_UPRIGHT;
        const s = S.sensor.last;
        if (s) R = M.mul3(M.sensorMatrix(s.alpha, s.beta, s.gamma), R_CAM2DEV);
        S.poseLock = { R, C: [0, 0, 0] };
        S.poseLockYaw = camYawOf(R);
        S.poseLockSource = 'init';
        S.drift = [0, 0, 0];
        const sy = currentSensorYaw();
        S.yawOffset = sy == null ? null : M.normalizeAngle(S.poseLockYaw - sy);
        applyPose(S.poseLock, s ? 'sensor' : 'init');
        updateCalibBadge();
        setStatus('Đã dựng không gian bằng cảm biến', 'Chạm vào màn hình để đặt mốc — app sẽ ghi nhớ khung cảnh để lần sau nhận ra');
        if (!silent) toast('📍 Giữ máy một chút — đang ghi nhớ khung cảnh xung quanh.');
        setTimeout(() => {
            if (!S.open || !S.poseLock || S.poseLockSource !== 'init') return;
            captureReference('home').then(saved => {
                if (saved) {
                    S.visual.lastCaptureAt = performance.now();
                    S.visual.lastCapturePos = S.pose.C.slice();
                }
            });
        }, 900);
        saveSoon();
        renderSheet();
        return true;
    }

    async function restartWithSensor() {
        if (!S.spatial) return;
        if (Object.keys(S.spatial.anchors || {}).length) {
            toast('Không gian đã có mốc AR — hãy quét mã neo để khôi phục đúng hệ toạ độ.');
            return;
        }
        const V = visualApi();
        if (V && S.space) { try { await V.deleteRefs(S.space.id); } catch (e) { } }
        S.visual.refs = [];
        S.visual.cursor = 0;
        S.visual.lockedOnce = false;
        S.visual.lastCapturePos = null;
        S.visual.lastCaptureAt = 0;
        S.spatial.frameId = null;
        S.poseLock = null;
        S.pose = null;
        S.yawOffset = null;
        initFromSensor(false);
    }

    async function loadVisualRefs() {
        const V = visualApi();
        S.visual.refs = [];
        S.visual.ready = !V;
        if (!V || !S.space) return;
        try {
            const rows = await V.listRefs(S.space.id);
            const fid = S.spatial && S.spatial.frameId;
            S.visual.refs = (rows || []).filter(r => !fid || !r.frameId || r.frameId === fid);
            if (S.visual.refs[0] && S.visual.refs[0].focalNorm > 0) {
                S.visual.focalNorm = S.visual.refs[0].focalNorm;
            }
        } catch (e) { }
        S.visual.ready = true;
    }

    function waitForSensor(ms) {
        return new Promise(resolve => {
            if (currentSensorYaw() != null) return resolve(true);
            const t0 = performance.now();
            const id = setInterval(() => {
                if (currentSensorYaw() != null) { clearInterval(id); resolve(true); }
                else if (performance.now() - t0 > ms) { clearInterval(id); resolve(false); }
            }, 60);
        });
    }

    function isTrackingPose() {
        return !!(S.pose && S.poseLock && (S.pose.source === 'sensor' || S.pose.source === 'visual'));
    }

    /* ---------------- sensors & PDR ---------------- */
    function onOrientation(e) {
        if (!S.open) return;
        if (e.alpha == null && e.beta == null) return;
        S.sensor.last = { alpha: e.alpha || 0, beta: e.beta || 0, gamma: e.gamma || 0 };
        S.sensor.at = performance.now();
        if (isTrackingPose()) updateSensorPose();
        refreshSensorUI();
    }

    function onMotion(e) {
        if (!S.open || !S.pdr.on || !S.poseLock) return;
        const a = e.accelerationIncludingGravity || e.acceleration;
        if (!a || a.x == null) return;
        const mag = Math.hypot(a.x, a.y, a.z);
        if (!isFinite(mag)) return;
        const p = S.pdr;
        p.baseline += (mag - p.baseline) * 0.04;
        const dev = mag - p.baseline;
        const t = e.timeStamp || performance.now();
        if (p.wasBelow && dev > 1.15 && t - p.lastPeak > 320) {
            p.steps++;
            p.lastPeak = t;
            p.wasBelow = false;
            if (S.pose && S.pose.R) {
                const fwd = [S.pose.R[0][2], S.pose.R[1][2], 0];
                const h = M.norm(fwd);
                S.drift[0] += h[0] * S.stepCm;
                S.drift[1] += h[1] * S.stepCm;
            }
            if (isTrackingPose()) updateSensorPose();
            refreshSensorUI();
        } else if (dev < 0.35) {
            p.wasBelow = true;
        }
    }

    function currentSensorYaw() {
        const s = S.sensor.last;
        if (!s) return null;
        if (performance.now() - S.sensor.at > 4000) return null;
        return M.sensorYaw(s.alpha, s.beta, s.gamma);
    }

    function updateSensorPose() {
        if (!S.poseLock) return;
        const sy = currentSensorYaw();
        if (sy == null || S.yawOffset == null) return;
        const yawNow = M.normalizeAngle(sy + S.yawOffset);
        const dYaw = M.normalizeAngle(yawNow - S.poseLockYaw);
        const R = M.mul3(M.rotZ(dYaw), S.poseLock.R);
        const C = [S.poseLock.C[0] + S.drift[0], S.poseLock.C[1] + S.drift[1], S.poseLock.C[2]];
        S.pose = { R, C, source: S.poseLockSource === 'visual' ? 'visual' : 'sensor' };
        updateCalibBadge();
    }

    async function requestSensorPermission() {
        if (S.sensorPermissionAsked) return;
        S.sensorPermissionAsked = true;
        try {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                await DeviceOrientationEvent.requestPermission().catch(() => null);
            }
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
                await DeviceMotionEvent.requestPermission().catch(() => null);
            }
        } catch (e) { }
    }

    function refreshSensorUI() {
        const el = $('lsa-sensor-info');
        if (!el) return;
        const sy = currentSensorYaw();
        const steps = S.pdr.steps;
        el.textContent = sy == null
            ? `Cảm biến: chưa có dữ liệu · ${steps} bước`
            : `Cảm biến: OK · ${steps} bước · ${S.pose && S.pose.source === 'qr' ? 'đang khóa QR' : (S.pose && S.pose.source === 'visual' ? 'theo dõi thị giác' : 'bám cảm biến')}`;
    }

    /* ---------------- projection / pins ---------------- */
    function viewMapping() {
        const vw = (S.video && S.video.videoWidth) || 1280;
        const vh = (S.video && S.video.videoHeight) || 720;
        const W = S.root.clientWidth || window.innerWidth;
        const H = S.root.clientHeight || window.innerHeight;
        const scale = Math.max(W / vw, H / vh);
        return { vw, vh, W, H, scale, ox: (W - vw * scale) / 2, oy: (H - vh * scale) / 2 };
    }

    function estimatedErrorCm(distCm) {
        const calib = S.spatial && S.spatial.calib;
        const reproj = calib ? calib.reprojPx : 2;
        const f = focalPx() || 800;
        const bearingErr = reproj / f;
        return Math.max(8, Math.round((distCm * bearingErr * 2 + distCm * 0.02 + 8) * 10) / 10);
    }

    function ensurePin(id) {
        if (S.pinEls[id]) return S.pinEls[id];
        const el = document.createElement('div');
        el.className = 'lsa-pin';
        el.dataset.id = id;
        el.innerHTML = '<div class="dot"></div><div class="lab"></div><div class="meta"></div>';
        el.onclick = ev => { ev.stopPropagation(); openDetail(id); };
        S.pinsBox.appendChild(el);
        S.pinEls[id] = el;
        return el;
    }

    function renderPins() {
        if (!S.open || !S.root) return;
        const spatial = S.spatial;
        const pins = Object.keys((spatial && spatial.anchors) || {});
        const alive = new Set(pins);
        for (const id in S.pinEls) {
            if (!alive.has(id)) { S.pinEls[id].remove(); delete S.pinEls[id]; }
        }
        if (!S.pose) { refreshPinVisibility(); return; }

        const map = viewMapping();
        const f = focalPx();
        const cx = map.vw / 2, cy = map.vh / 2;
        const margin = 34;

        const place = (el, uv, dist, opts) => {
            let x = map.ox + uv[0] * map.scale;
            let y = map.oy + uv[1] * map.scale;
            let edge = false;
            if (x < margin) { x = margin; edge = true; }
            if (x > map.W - margin) { x = map.W - margin; edge = true; }
            if (y < margin) { y = margin; edge = true; }
            if (y > map.H - margin) { y = map.H - margin; edge = true; }
            const s = opts.ghost ? 1 : M.clamp(300 / (dist + 80), 0.7, 1.2);
            el.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${s})`;
            el.style.display = 'flex';
            el.classList.toggle('edge', edge && !opts.ghost);
            return { x, y, edge };
        };

        const anchors = anchorList();
        for (const a of anchors) {
            const rec = spatial.anchors[a.id];
            if (!rec || !Array.isArray(rec.world)) continue;
            const pCam = M.worldToCamera(S.pose, rec.world);
            const uv = M.projectCam(pCam, f, cx, cy);
            const el = ensurePin(a.id);
            if (!uv) { el.style.display = 'none'; continue; }
            const dist = Math.hypot(pCam[0], pCam[1], pCam[2]);
            const idx = anchors.indexOf(a) + 1;
            el.querySelector('.dot').textContent = a.order || idx;
            el.querySelector('.lab').textContent = a.title || 'Mốc';
            el.querySelector('.meta').textContent = `${(dist / 100).toFixed(1)} m · ±${Math.round(estimatedErrorCm(dist))} cm`;
            el.classList.toggle('sel', S.detailId === a.id || S.selectedId === a.id);
            el.classList.remove('ghost');
            place(el, uv, dist, {});
        }

        const ghost = $('lsa-ghost-pin');
        if (ghost) {
            if (!S.placing || !S.pose) ghost.style.display = 'none';
            else {
                const fwd = M.poseForwardWorld(S.pose);
                const P = [S.pose.C[0] + fwd[0] * S.distanceCm, S.pose.C[1] + fwd[1] * S.distanceCm, S.pose.C[2] + fwd[2] * S.distanceCm];
                const uv = S.aimUv || M.projectWorld(S.pose, P, f, cx, cy);
                if (!uv) ghost.style.display = 'none';
                else place(ghost, uv, S.distanceCm, { ghost: true });
            }
        }
    }

    function refreshPinVisibility() {
        if (!S.pose) {
            for (const id in S.pinEls) S.pinEls[id].style.display = 'none';
        }
    }

    function updateReticle() {
        const ret = $('lsa-reticle');
        if (!ret) return;
        ret.classList.toggle('on', !!S.placing);
        const chip = $('lsa-dist-chip');
        if (chip) chip.textContent = `${(S.distanceCm / 100).toFixed(1)} m`;
    }

    /* ---------------- placement ---------------- */
    function setPlacing(id, on) {
        S.selectedId = on ? id : null;
        S.placing = on ? { id } : null;
        if (!on) { S.aimUv = null; S.tapStart = null; }
        if (on) $('lsa-sheet').classList.add('collapsed');
        else $('lsa-sheet').classList.remove('collapsed');
        renderSheet();
        updateReticle();
        renderPins();
    }

    function placeAtCenter() {
        if (!S.placing) return;
        if (!S.pose) { toast('Chưa khóa được không gian — hãy quét mã neo trước.'); return; }
        const fwd = M.poseForwardWorld(S.pose);
        const d = S.distanceCm;
        const P = [
            S.pose.C[0] + fwd[0] * d,
            S.pose.C[1] + fwd[1] * d,
            S.pose.C[2] + fwd[2] * d
        ];
        saveAnchorPos(S.placing.id, P, 'crosshair');
    }

    function placeAtStand() {
        if (!S.placing) return;
        if (!S.pose) { toast('Chưa khóa được không gian — hãy quét mã neo trước.'); return; }
        const fwd = M.poseForwardWorld(S.pose);
        const h = M.norm([fwd[0], fwd[1], 0]);
        const P = [S.pose.C[0] + h[0] * 25, S.pose.C[1] + h[1] * 25, S.pose.C[2]];
        saveAnchorPos(S.placing.id, P, 'stand');
    }

    function screenToVideo(clientX, clientY) {
        const map = viewMapping();
        const u = (clientX - map.ox) / map.scale;
        const v = (clientY - map.oy) / map.scale;
        return { u, v, map };
    }

    function placeAtScreen(clientX, clientY) {
        if (!S.placing) return false;
        if (!S.pose) { toast('Chưa khóa được không gian — hãy quét mã neo trước.'); return false; }
        const { u, v, map } = screenToVideo(clientX, clientY);
        if (u < 0 || u > map.vw || v < 0 || v > map.vh) return false;
        const P = M.pointAlongRay(S.pose, u, v, focalPx(), map.vw / 2, map.vh / 2, S.distanceCm);
        if (!P) return false;
        saveAnchorPos(S.placing.id, P, 'tap');
        return true;
    }

    function onScenePointerDown(e) {
        if (!S.placing) return;
        if (e.target.closest('.lsa-sheet,.lsa-top,.lsa-pin,.lsa-modal,.lsa-fallback,.lsa-detail')) return;
        S.tapStart = { x: e.clientX, y: e.clientY, t: performance.now() };
        const { u, v, map } = screenToVideo(e.clientX, e.clientY);
        if (u >= 0 && u <= map.vw && v >= 0 && v <= map.vh) S.aimUv = [u, v];
    }

    function onScenePointerMove(e) {
        if (!S.placing || e.pointerType === 'mouse' && e.buttons === 0) return;
        if (e.target.closest('.lsa-sheet,.lsa-top,.lsa-modal,.lsa-fallback,.lsa-detail')) return;
        const { u, v, map } = screenToVideo(e.clientX, e.clientY);
        if (u >= 0 && u <= map.vw && v >= 0 && v <= map.vh) S.aimUv = [u, v];
    }

    function onScenePointerUp(e) {
        if (!S.placing || !S.tapStart) return;
        const dx = e.clientX - S.tapStart.x, dy = e.clientY - S.tapStart.y;
        const dt = performance.now() - S.tapStart.t;
        S.tapStart = null;
        if (dx * dx + dy * dy > 100 || dt > 900) return;
        if (e.target.closest('.lsa-sheet,.lsa-top,.lsa-pin,.lsa-modal,.lsa-fallback,.lsa-detail')) return;
        placeAtScreen(e.clientX, e.clientY);
    }

    function bindSceneTaps() {
        if (!S.root || S.root.dataset.tapsBound) return;
        S.root.dataset.tapsBound = '1';
        S.root.addEventListener('pointerdown', onScenePointerDown, true);
        S.root.addEventListener('pointermove', onScenePointerMove, true);
        S.root.addEventListener('pointerup', onScenePointerUp, true);
    }

    function saveAnchorPos(id, P, source) {
        const spatial = ensureSpatial(S.space);
        const cam = S.pose.C;
        const dist = Math.hypot(P[0] - cam[0], P[1] - cam[1], P[2] - cam[2]);
        spatial.anchors[id] = {
            world: [Math.round(P[0] * 10) / 10, Math.round(P[1] * 10) / 10, Math.round(P[2] * 10) / 10],
            yaw: Math.round(camYawOf(S.pose.R) * M.R2D * 10) / 10,
            at: Date.now(),
            source,
            errCm: estimatedErrorCm(dist)
        };
        try { S.bridge && S.bridge.persist && S.bridge.persist(); } catch (e) { }
        toast(`📍 Đã gắn "${anchorTitle(id)}" vào không gian thật.`);
        setPlacing(id, false);
        renderSheet();
        renderPins();
        setTimeout(() => {
            if (S.open) captureReference('anchor:' + id, { anchorId: id });
        }, 350);
    }

    function removeAnchorPos(id) {
        if (!S.spatial || !S.spatial.anchors[id]) return;
        delete S.spatial.anchors[id];
        try { S.bridge && S.bridge.persist && S.bridge.persist(); } catch (e) { }
        toast('Đã xoá vị trí AR của mốc.');
        renderSheet();
        renderPins();
    }

    /* ---------------- detail card ---------------- */
    function openDetail(id) {
        const a = anchorList().find(x => x.id === id) || { id, title: anchorTitle(id) };
        S.detailId = id;
        const card = $('lsa-detail');
        const rec = S.spatial.anchors[id];
        const pano = (S.bridge && S.bridge.getPanoMarker) ? S.bridge.getPanoMarker(id) : null;
        card.innerHTML = `
            <button class="x" id="lsa-detail-x">✕</button>
            <h3>${esc(a.title || 'Mốc')}</h3>
            ${a.summary ? `<p>${esc(a.summary)}</p>` : ''}
            ${(a.keyPoints && a.keyPoints.length) ? `<ul>${a.keyPoints.map(k => `<li>${esc(k)}</li>`).join('')}</ul>` : ''}
            ${rec ? `<p style="color:#7dd3fc;font-size:11.5px">Vị trí AR: cách camera ${(Math.hypot(rec.world[0] - S.pose.C[0], rec.world[1] - S.pose.C[1], rec.world[2] - S.pose.C[2]) / 100).toFixed(1)} m · sai số ±${rec.errCm || '—'} cm</p>` : `<p style="color:#fcd34d;font-size:11.5px">Mốc này chưa có vị trí trong không gian thật.</p>`}
            <div class="lsa-row">
                <button class="lsa-btn ok" id="lsa-detail-place">📍 Đặt lại vị trí</button>
                ${pano ? `<button class="lsa-btn ghost" id="lsa-detail-pano">🖼 Xem ảnh 360</button>` : ''}
            </div>
            ${rec ? `<div class="lsa-row"><button class="lsa-btn danger" id="lsa-detail-remove">🗑 Xoá vị trí AR</button></div>` : ''}
        `;
        card.classList.add('on');
        $('lsa-detail-x').onclick = closeDetail;
        $('lsa-detail-place').onclick = () => { closeDetail(); setPlacing(id, true); };
        const panoBtn = $('lsa-detail-pano');
        if (panoBtn) panoBtn.onclick = () => {
            closeDetail();
            close();
            try { S.bridge.focusPanoMarker(id); } catch (e) { }
        };
        const rm = $('lsa-detail-remove');
        if (rm) rm.onclick = () => { closeDetail(); removeAnchorPos(id); };
        renderPins();
    }

    function closeDetail() {
        S.detailId = null;
        const card = $('lsa-detail');
        if (card) card.classList.remove('on');
        renderPins();
    }

    /* ---------------- sheet ---------------- */
    function renderSheet() {
        if (!S.root) return;
        ['anchors', 'calib', 'settings'].forEach(t => {
            const b = $('lsa-tab-' + t);
            if (b) b.classList.toggle('on', S.tab === t);
        });
        $('lsa-sheet').classList.toggle('collapsed', !!S.placing);
        const body = $('lsa-body');
        if (S.tab === 'anchors') body.innerHTML = renderAnchorsTab();
        else if (S.tab === 'calib') body.innerHTML = renderCalibTab();
        else body.innerHTML = renderSettingsTab();
        bindSheet();
        updateReticle();
    }

    function renderAnchorsTab() {
        const anchors = anchorList();
        const spatial = S.spatial || { anchors: {} };
        if (!anchors.length) {
            return `<p class="lsa-hint">Bài học này chưa có mốc nào. Hãy chọn chủ đề ở bảng "Mốc kiến thức" trong chế độ 360 trước.</p>`;
        }
        const locked = !!S.pose;
        const rows = anchors.map((a, i) => {
            const rec = spatial.anchors[a.id];
            const armed = !!(S.placing && S.placing.id === a.id);
            return `<div class="lsa-item ${armed ? 'armed sel' : ''}" data-anchor="${esc(a.id)}">
                <span class="n">${esc(a.order || (i + 1))}</span>
                <span class="t">${esc(a.title)}<small>${rec ? `AR: cách mã ${(Math.hypot(rec.world[0], rec.world[1], rec.world[2]) / 100).toFixed(1)} m · ±${rec.errCm || '—'} cm` : 'Chưa gắn vào không gian thật'}</small></span>
                <span class="st">${rec ? '✓ AR' : '—'}</span>
            </div>`;
        }).join('');

        const sel = S.placing ? anchors.find(a => a.id === S.placing.id) : null;
        return `
            <p class="lsa-hint">${locked ? 'Chọn mốc → chạm vào đúng chỗ trên màn hình để đặt (hoặc ngắm tâm rồi bấm nút).' : (S.visual.refs.length ? 'Đang tìm lại khung cảnh đã ghi nhớ — chiếu camera về khu vực đặt mốc. Không cần mã QR.' : 'Bấm “Ghi nhớ khung cảnh” ở tab ⚙ hoặc quét mã neo để khóa không gian trước khi gắn mốc.')}</p>
            ${rows}
            ${sel ? `
                <div class="lsa-field"><span>Khoảng cách tới mốc</span><b style="color:#7dd3fc">${(S.distanceCm / 100).toFixed(1)} m</b></div>
                <input class="lsa-range" type="range" id="lsa-dist" min="${PLACE_MIN_CM}" max="${PLACE_MAX_CM}" step="10" value="${S.distanceCm}">
                <div class="lsa-row">
                    <button class="lsa-btn ok" id="lsa-place-center" ${locked ? '' : 'disabled'}>📍 Đặt tại tâm ngắm</button>
                    <button class="lsa-btn ghost" id="lsa-place-stand" ${locked ? '' : 'disabled'}>🧍 Tại chỗ đứng</button>
                </div>
                <div class="lsa-row"><button class="lsa-btn ghost" id="lsa-place-cancel" style="flex:1">Hủy chọn mốc</button></div>
                <p class="lsa-hint" style="margin-top:8px">Chạm trực tiếp vào màn hình để đặt mốc đang chọn; kéo thanh khoảng cách nếu cần chỉnh xa/gần.</p>
            ` : ''}
        `;
    }

    function renderCalibTab() {
        const calib = S.spatial && S.spatial.calib;
        const locked = !!S.poseLock;
        const refs = S.visual.refs.length;
        const anchorCount = Object.keys((S.spatial && S.spatial.anchors) || {}).length;
        const src = poseSourceLabel();
        return `
            <p class="lsa-hint"><b>Không cần dán mã QR.</b> Khi bạn đặt mốc, app tự ghi nhớ khung cảnh. Lần sau mở lại, chỉ cần chiếu camera về khu vực đó là app nhận ra và mốc vẫn nằm đúng chỗ.</p>
            <div class="lsa-row" style="margin-top:0">
                <button class="lsa-btn pri" id="lsa-remember" ${S.pose ? '' : 'disabled'}>🧠 Ghi nhớ khung cảnh</button>
            </div>
            <p class="lsa-hint">Đã lưu <b>${refs}</b> khung cảnh cho không gian này${S.visual.lastInliers ? ` · lần khớp gần nhất ${S.visual.lastInliers} điểm` : ''}.</p>
            <div class="lsa-field"><span>Nguồn định vị</span><b style="color:#7dd3fc">${src}</b></div>
            ${!S.pose && !anchorCount ? `<div class="lsa-row" style="margin-top:0"><button class="lsa-btn ghost" id="lsa-init-sensor" style="flex:1">📐 Bắt đầu bằng cảm biến</button></div>` : ''}
            <p class="lsa-hint" style="margin-top:14px"><b>Mã neo QR (tuỳ chọn)</b> — in một tờ dán lên tường nếu muốn khóa vị trí chính xác tuyệt đối, hoặc khi không thể nhận dạng khung cảnh.</p>
            <div class="lsa-row" style="margin-top:0">
                <button class="lsa-btn ghost" id="lsa-make-qr">🎯 Tạo mã neo</button>
                <button class="lsa-btn ghost" id="lsa-help-btn">❓ Cách dùng</button>
            </div>
            <div class="lsa-field" style="margin-top:10px"><span>Khoảng cách thật tới mã khi quét</span>
                <div style="display:flex;align-items:center;gap:6px">
                    <input type="number" id="lsa-calib-dist" min="40" max="600" step="10" value="${S.calibDistanceCm}">
                    <span style="font-size:11px;color:#94a3b8">cm</span>
                </div>
            </div>
            ${calib ? `<div class="lsa-field"><span>Mã ${calib.qrSizeCm} cm · sai số quét</span><b style="color:#7dd3fc">${calib.reprojPx} px (${calib.quality})</b></div>` : ''}
            ${calib ? `<div class="lsa-row" style="margin-top:0"><button class="lsa-btn ghost" id="lsa-recalib" style="flex:1">♻ Hiệu chỉnh lại tiêu cự (quét lại mã)</button></div>` : ''}
            <p class="lsa-hint" id="lsa-sensor-info">Cảm biến: đang kiểm tra…</p>
            ${S.space && S.space._isShared ? `<p class="lsa-hint" style="color:#fcd34d">Đây là không gian chia sẻ (chỉ xem). Hãy bấm "Lưu bản sao" ở góc trên để giữ dữ liệu AR bạn tạo.</p>` : ''}
        `;
    }

    function renderSettingsTab() {
        return `
            <div class="lsa-field"><span>Bám chuyển động (đếm bước)</span>
                <input type="checkbox" id="lsa-pdr" ${S.pdr.on ? 'checked' : ''} style="width:20px;height:20px">
            </div>
            <div class="lsa-field"><span>Chiều dài bước chân</span>
                <div style="display:flex;align-items:center;gap:6px">
                    <input type="number" id="lsa-step" min="40" max="110" step="1" value="${S.stepCm}">
                    <span style="font-size:11px;color:#94a3b8">cm</span>
                </div>
            </div>
            <div class="lsa-field"><span>Tiêu cự ước lượng</span><b style="color:#7dd3fc">${(focalPx() / ((S.video && S.video.videoWidth) || 1)).toFixed(3)} × W</b></div>
            <p class="lsa-hint">Khung cảnh ghi nhớ chỉ lưu trên thiết bị này (ảnh xám + điểm đặc trưng), không gửi lên máy chủ. Mốc AR được lưu cùng không gian 360 và đồng bộ theo tài khoản Firebase.</p>
            ${S.visual.refs.length ? `<div class="lsa-row"><button class="lsa-btn ghost" id="lsa-forget-scenes" style="flex:1">🧠 Xoá ${S.visual.refs.length} khung cảnh đã nhớ</button></div>` : ''}
            <div class="lsa-row"><button class="lsa-btn danger" id="lsa-reset-ar" style="flex:1">🗑 Xoá toàn bộ dữ liệu AR của không gian</button></div>
        `;
    }

    function bindSheet() {
        const body = $('lsa-body');
        body.querySelectorAll('[data-anchor]').forEach(el => {
            el.onclick = () => {
                const id = el.dataset.anchor;
                if (S.placing && S.placing.id === id) setPlacing(id, false);
                else setPlacing(id, true);
            };
        });
        const dist = $('lsa-dist');
        if (dist) {
            const paint = () => {
                S.distanceCm = Number(dist.value);
                const field = body.querySelector('.lsa-field b');
                if (field && field.textContent.includes('m')) field.textContent = `${(S.distanceCm / 100).toFixed(1)} m`;
                updateReticle();
            };
            dist.oninput = paint;
            dist.onchange = paint;
        }
        const pc = $('lsa-place-center');
        if (pc) pc.onclick = placeAtCenter;
        const ps = $('lsa-place-stand');
        if (ps) ps.onclick = placeAtStand;
        const cancel = $('lsa-place-cancel');
        if (cancel) cancel.onclick = () => { if (S.placing) setPlacing(S.placing.id, false); };
        const make = $('lsa-make-qr');
        if (make) make.onclick = () => { renderQr(); $('lsa-qr-modal').classList.add('on'); };
        const help = $('lsa-help-btn');
        if (help) help.onclick = () => $('lsa-help-modal').classList.add('on');
        const remember = $('lsa-remember');
        if (remember) remember.onclick = () => {
            if (!S.pose) { toast('Chưa xác định được hướng nhìn — hãy chờ nhận dạng hoặc quét mã neo.'); return; }
            remember.disabled = true;
            captureReference('manual:' + Date.now()).then(saved => {
                remember.disabled = false;
                toast(saved ? '🧠 Đã ghi nhớ khung cảnh. Lần sau chỉ cần chiếu camera vào đây.' : 'Khung cảnh ít đặc điểm — hãy xoay camera sang vùng có nhiều đồ vật rồi thử lại.');
                if (S.open) renderSheet();
            });
        };
        const initBtn = $('lsa-init-sensor');
        if (initBtn) initBtn.onclick = () => restartWithSensor();
        const forget = $('lsa-forget-scenes');
        if (forget) forget.onclick = () => {
            if (!confirm('Xoá toàn bộ khung cảnh đã ghi nhớ trên thiết bị này?')) return;
            clearVisualRefs();
            renderSheet();
            toast('Đã xoá khung cảnh đã nhớ.');
        };
        const recalib = $('lsa-recalib');
        if (recalib) recalib.onclick = () => {
            if (!S.spatial.calib) return;
            delete S.spatial.calib.focalNorm;
            S.poseLock = null;
            S.pose = null;
            S.yawOffset = null;
            clearVisualRefs();
            try { S.bridge.persist(); } catch (e) { }
            renderSheet();
            updateCalibBadge();
            toast('♻ Hãy quét lại mã ở khoảng cách đã nhập để hiệu chỉnh tiêu cự.');
        };
        const calibDist = $('lsa-calib-dist');
        if (calibDist) {
            calibDist.onchange = () => {
                const v = Number(calibDist.value);
                if (v >= 40 && v <= 600) { S.calibDistanceCm = v; toast(`Khoảng cách hiệu chỉnh: ${v} cm`); }
            };
        }
        const pdr = $('lsa-pdr');
        if (pdr) pdr.onchange = () => { S.pdr.on = pdr.checked; };
        const step = $('lsa-step');
        if (step) step.onchange = () => {
            const v = Number(step.value);
            if (v >= 40 && v <= 110) S.stepCm = v;
        };
        const reset = $('lsa-reset-ar');
        if (reset) reset.onclick = () => {
            if (!confirm('Xoá toàn bộ mã neo, khung cảnh đã nhớ và vị trí AR của không gian này?')) return;
            S.spatial.calib = null;
            S.spatial.anchors = {};
            S.spatial.frameId = null;
            S.poseLock = null; S.pose = null; S.yawOffset = null;
            clearVisualRefs();
            try { S.bridge.persist(); } catch (e) { }
            renderSheet(); renderPins(); updateCalibBadge();
            toast('Đã xoá dữ liệu AR.');
        };
        refreshSensorUI();
    }

    /* ---------------- loops ---------------- */
    function tick() {
        if (!S.open) return;
        S.rafId = requestAnimationFrame(tick);
        if (isTrackingPose()) updateSensorPose();
        maybeAutoCapture();
        renderPins();
    }

    /* ---------------- open / close ---------------- */
    async function open(opts) {
        opts = opts || {};
        const bridge = opts.bridge || window.Loci360Bridge;
        if (!bridge) { alert('Chưa kết nối được trình xem 360.'); return; }
        const space = bridge.getSpace ? bridge.getSpace() : null;
        if (!space) { alert('Hãy mở một không gian 360 trước khi dùng mốc AR.'); return; }

        S.bridge = bridge;
        S.space = space;
        S.spatial = ensureSpatial(space);
        S.pose = null;
        S.poseLock = null;
        S.poseLockSource = null;
        S.yawOffset = null;
        S.drift = [0, 0, 0];
        S.selectedId = null;
        S.placing = null;
        S.detailId = null;
        S.scanMisses = 0;
        S.pdr.steps = 0;
        S.tab = 'anchors';
        S.focalOverride = opts.focalNorm || 0;
        if (!S.calibDistanceCm) S.calibDistanceCm = 150;
        S.visual.busy = false;
        S.visual.lastTry = 0;
        S.visual.lastOk = 0;
        S.visual.lastInliers = 0;
        S.visual.lockedOnce = false;
        S.visual.cursor = 0;
        S.visual.lastCaptureAt = 0;
        S.visual.lastCapturePos = null;
        const refsTask = loadVisualRefs();

        buildDom();
        bindSceneTaps();
        S.aimUv = null;
        S.tapStart = null;
        if (S.spatial.calib) {
            if (S.spatial.calib.qrSizeCm) S.qrSizeCm = S.spatial.calib.qrSizeCm;
            if (S.spatial.calib.distanceCm) S.calibDistanceCm = S.spatial.calib.distanceCm;
        }
        const qrSizeSel = $('lsa-qr-size');
        if (qrSizeSel) qrSizeSel.value = String(S.qrSizeCm);
        $('lsa-qr-modal').classList.remove('on');
        $('lsa-help-modal').classList.remove('on');
        $('lsa-detail').classList.remove('on');
        $('lsa-fallback').classList.remove('on');
        S.root.classList.add('on');
        S.open = true;
        try { bridge.setPaused && bridge.setPaused(true); } catch (e) { }
        setStatus('Đang khởi động camera…', '');
        updateCalibBadge();
        renderSheet();
        updateReticle();

        const sensorAttempt = opts.stream ? Promise.resolve() : requestSensorPermission();
        window.addEventListener('deviceorientation', onOrientation, true);
        window.addEventListener('deviceorientationabsolute', onOrientation, true);
        window.addEventListener('devicemotion', onMotion, true);

        const stream = opts.stream || window.__LSA_TEST_STREAM__ || null;
        try {
            await startCamera(stream);
        } catch (err) {
            showFallback(err);
            return;
        }
        await sensorAttempt;
        if (!S.open) return;
        await refsTask;
        if (!S.open) return;

        S.pose = S.poseLock = null;
        await waitForSensor(900);
        if (!S.open) return;
        if (canInitFrame()) initFromSensor(false);

        if (!S.pose) {
            if (S.visual.refs.length) {
                setStatus('Đang tìm lại khung cảnh…', 'Chiếu camera về khu vực đã ghi nhớ — không cần mã QR');
            } else if (S.spatial.calib && S.spatial.calib.focalNorm > 0) {
                setStatus('Đang tìm mã neo…', 'Đưa mã QR vào khung hình để khóa lại không gian');
            } else {
                setStatus('Chưa khóa không gian', 'Ghi nhớ khung cảnh ở tab ⚙ hoặc quét mã neo để bắt đầu');
            }
        }
        clearInterval(S.scanTimer);
        S.scanTimer = setInterval(scanOnce, SCAN_INTERVAL_MS);
        clearInterval(S.visualTimer);
        S.visualTimer = setInterval(tryVisualRelocalize, VISUAL_INTERVAL_MS + 60);
        cancelAnimationFrame(S.rafId);
        S.rafId = requestAnimationFrame(tick);
        renderSheet();
    }

    function showFallback(err) {
        const el = $('lsa-fallback');
        if (!el) return;
        const msg = (err && err.message) || 'Không mở được camera.';
        el.innerHTML = `
            <h3 style="margin:0 0 8px;font-size:16px">📷 Không mở được camera</h3>
            <p style="font-size:12.5px;color:#cbd5e1;line-height:1.55;margin:0 0 12px">${esc(msg)}</p>
            <p style="font-size:12px;color:#94a3b8;line-height:1.55;margin:0 0 14px">Bạn vẫn có thể dùng <b>chế độ 360°</b> để xem và gắn mốc. Mốc AR cần camera trên HTTPS (điện thoại) hoặc localhost (máy tính).</p>
            <div class="lsa-row" style="margin-top:0">
                <button class="lsa-btn pri" id="lsa-retry">🔄 Thử lại</button>
                <button class="lsa-btn ghost" id="lsa-to-360">🖼 Về chế độ 360</button>
            </div>`;
        el.classList.add('on');
        setStatus('Camera không khả dụng', 'Dùng chế độ 360° thay thế');
        $('lsa-retry').onclick = () => { el.classList.remove('on'); open({ bridge: S.bridge, focalNorm: S.focalOverride }); };
        $('lsa-to-360').onclick = close;
    }

    function close() {
        if (!S.open) return;
        S.open = false;
        cancelAnimationFrame(S.rafId);
        clearInterval(S.scanTimer);
        clearInterval(S.visualTimer);
        S.scanTimer = null;
        S.visualTimer = null;
        S.visual.busy = false;
        S.visual.ready = false;
        window.removeEventListener('deviceorientation', onOrientation, true);
        window.removeEventListener('deviceorientationabsolute', onOrientation, true);
        window.removeEventListener('devicemotion', onMotion, true);
        stopCamera();
        if (S.root) S.root.classList.remove('on');
        $('lsa-detail') && $('lsa-detail').classList.remove('on');
        $('lsa-qr-modal') && $('lsa-qr-modal').classList.remove('on');
        $('lsa-help-modal') && $('lsa-help-modal').classList.remove('on');
        $('lsa-fallback') && $('lsa-fallback').classList.remove('on');
        try { S.bridge && S.bridge.setPaused && S.bridge.setPaused(false); } catch (e) { }
        try { S.bridge && S.bridge.persist && S.bridge.persist(); } catch (e) { }
        S.placing = null;
        S.selectedId = null;
        S.pose = null;
    }

    /* ---------------- public api ---------------- */
    window.LociSpatial = {
        __version: VERSION,
        open,
        close,
        isOpen: () => S.open,
        getState: () => ({
            open: S.open,
            spaceId: S.space && S.space.id,
            calib: S.spatial && S.spatial.calib,
            anchors: S.spatial && S.spatial.anchors,
            frameId: S.spatial && S.spatial.frameId,
            pose: S.pose,
            locked: !!S.poseLock,
            poseSource: S.pose && S.pose.source,
            poseLockSource: S.poseLockSource,
            yawOffset: S.yawOffset,
            sensor: S.sensor.last,
            steps: S.pdr.steps,
            distanceCm: S.distanceCm,
            placingId: S.placing && S.placing.id,
            visualRefs: S.visual.refs.length,
            visualInliers: S.visual.lastInliers
        }),
        _test: {
            setStream: stream => { window.__LSA_TEST_STREAM__ = stream; },
            scan: scanOnce,
            placeAtCenter,
            placeAtStand,
            placeAtScreen,
            aimUv: () => S.aimUv,
            sheetCollapsed: () => $('lsa-sheet').classList.contains('collapsed'),
            select: id => setPlacing(id, true),
            setDistance: cm => { S.distanceCm = cm; updateReticle(); },
            anchorsTab: () => { S.tab = 'anchors'; renderSheet(); },
            calibTab: () => { S.tab = 'calib'; renderSheet(); },
            renderPins,
            viewMapping,
            processQr,
            poseFromQRCorners: M.poseFromQRCorners,
            markerToWorld: M.markerToWorld,
            projectWorld: M.projectWorld,
            visual: {
                refs: () => S.visual.refs,
                ready: () => S.visual.ready,
                capture: (tag, opts) => captureReference(tag, opts),
                relocalize: () => { tryVisualRelocalize(true); return { inliers: S.visual.lastInliers, source: S.pose && S.pose.source }; },
                setRefs: rows => { S.visual.refs = rows || []; S.visual.ready = true; },
                clear: clearVisualRefs,
                initSensor: () => initFromSensor(true),
                state: () => ({
                    ready: S.visual.ready,
                    refs: S.visual.refs.length,
                    inliers: S.visual.lastInliers,
                    lastOk: S.visual.lastOk,
                    focalNorm: S.visual.focalNorm
                })
            },
            pinRects: () => {
                const out = {};
                for (const id in S.pinEls) {
                    const r = S.pinEls[id].getBoundingClientRect();
                    out[id] = { x: r.x, y: r.y, w: r.width, h: r.height, display: getComputedStyle(S.pinEls[id]).display };
                }
                return out;
            }
        }
    };
})();
