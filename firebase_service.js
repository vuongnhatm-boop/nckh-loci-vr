// ============================================================================
// LOCI EDU - FIREBASE SERVICE MODULE (Cloud Firestore + Storage + Auth)
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    getDocs, 
    query,
    orderBy,
    limit,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    enableIndexedDbPersistence 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    uploadString, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    getMessaging, 
    getToken, 
    onMessage 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

// Web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyA-WNTBsEGZRBfTkaVduWiMjdj-XyGW2n0",
  authDomain: "loci-b04a7.firebaseapp.com",
  projectId: "loci-b04a7",
  storageBucket: "loci-b04a7.firebasestorage.app",
  messagingSenderId: "518163277905",
  appId: "1:518163277905:web:50db730ade28ac06e07070",
  measurementId: "G-PRQ1ZQ3GN9"
};

// Initialize Firebase Core & Services
export const app = initializeApp(firebaseConfig);
let analytics = null;
try {
    if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
    }
} catch (e) {
    console.warn("[Firebase] Analytics not supported in this environment:", e);
}

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export let messaging = null;
try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        messaging = getMessaging(app);
    }
} catch (e) {
    console.warn("[Firebase] Messaging not supported in this environment:", e);
}

// Enable offline persistence if available
try {
    enableIndexedDbPersistence(db).catch(err => {
        if (err.code === 'failed-precondition') {
            console.warn('[Firestore] Multiple tabs open, persistence disabled');
        } else if (err.code === 'unimplemented') {
            console.warn('[Firestore] Browser does not support offline persistence');
        }
    });
} catch (_) {}

/**
 * Service Wrapper providing high-level database & storage methods for LOCI EDU
 */
export const LociFirebase = {
    app,
    db,
    storage,
    auth,
    messaging,
    currentUser: null,
    isOnline: true,

    _authListeners: [],
    _notifyAuth(user) {
        this.currentUser = user;
        this._authListeners.forEach(fn => {
            try { fn(user); } catch (e) { console.error(e); }
        });
    },

    // Hàm chuyển đổi Tên đăng nhập thường thành định danh hệ thống
    formatAuthIdentifier(input) {
        const raw = String(input || '').trim().toLowerCase();
        if (raw.includes('@')) return raw;
        const clean = raw.replace(/[^a-z0-9._-]/g, '');
        return `${clean || 'user'}@loci.edu.vn`;
    },

    // Hàm timeout an toàn tránh bị treo giao diện
    _withTimeout(promise, ms = 1200) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
        ]);
    },

    /**
     * Tạo tài khoản mới bằng Tên đăng nhập thường (hoặc Email) + Mật khẩu
     * Tự động lưu vào Firestore/Bộ nhớ nếu Firebase Auth chưa bật trong Console
     */
    async registerUser(usernameOrEmail, password, displayName) {
        const email = this.formatAuthIdentifier(usernameOrEmail);
        const username = usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail.trim();
        const cleanName = username.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'student';
        const realDisplayName = displayName && displayName.trim() ? displayName.trim() : cleanName;
        const uid = 'loci_' + cleanName;

        // 1. Kiểm tra tài khoản trong bộ nhớ trước
        const accounts = JSON.parse(localStorage.getItem('loci_accounts') || '{}');
        if (accounts[cleanName]) {
            throw new Error('Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác.');
        }

        const userData = {
            uid: uid,
            username: cleanName,
            displayName: realDisplayName,
            email: email,
            role: 'student',
            password: btoa(password),
            isDirect: true,
            stats: {
                weekMin: 0,
                answered: 0,
                streak: 1,
                accuracy: null,
                weakPoints: []
            }
        };

        // 2. LƯU NGAY LẬP TỨC VÀO BỘ NHỚ ĐỂ GIAO DIỆN KHÔNG BAO GIỜ BỊ TREO
        accounts[cleanName] = userData;
        localStorage.setItem('loci_accounts', JSON.stringify(accounts));
        localStorage.setItem('loci_current_user', JSON.stringify(userData));
        this.currentUser = userData;
        this._notifyAuth(userData);

        // 3. Thử đồng bộ ngầm với Firebase (không block giao diện)
        (async () => {
            try {
                const cred = await this._withTimeout(createUserWithEmailAndPassword(auth, email, password), 2000);
                if (cred && cred.user) {
                    await updateProfile(cred.user, { displayName: realDisplayName });
                    const userRef = doc(db, 'users', cred.user.uid);
                    await this._withTimeout(setDoc(userRef, {
                        uid: cred.user.uid,
                        username: cleanName,
                        displayName: realDisplayName,
                        email: email,
                        role: 'student',
                        createdAt: serverTimestamp(),
                        stats: userData.stats
                    }, { merge: true }), 2000);
                }
            } catch (_) {
                // Nếu Auth console chưa bật, lưu trực tiếp document vào Firestore
                try {
                    const userRef = doc(db, 'users', uid);
                    await this._withTimeout(setDoc(userRef, {
                        ...userData,
                        createdAt: serverTimestamp()
                    }, { merge: true }), 2000);
                    console.log('[Firestore] Đã đồng bộ tài khoản ngầm vào Firestore:', uid);
                } catch (e) {
                    console.warn('[Firestore] Đồng bộ Firestore ngầm offline note:', e.message);
                }
            }
        })();

        console.log('[Auth] Đăng ký thành công ngay cho:', realDisplayName, `(${cleanName})`);
        return userData;
    },

    /**
     * Đăng nhập bằng Tên đăng nhập thường (hoặc Email) + Mật khẩu
     */
    async loginUser(usernameOrEmail, password) {
        const cleanName = (usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail).replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
        const email = this.formatAuthIdentifier(usernameOrEmail);

        // 1. Kiểm tra tài khoản cục bộ trước (nhanh tức thì, không bị treo)
        const accounts = JSON.parse(localStorage.getItem('loci_accounts') || '{}');
        let localUser = accounts[cleanName];

        if (localUser && localUser.password === btoa(password)) {
            this.currentUser = localUser;
            localStorage.setItem('loci_current_user', JSON.stringify(localUser));
            this._notifyAuth(localUser);
            console.log('[Auth] Đăng nhập tức thì thành công:', localUser.displayName || cleanName);
            return localUser;
        }

        // 2. Thử đăng nhập qua Firebase Auth hoặc Firestore
        try {
            const cred = await this._withTimeout(signInWithEmailAndPassword(auth, email, password), 2000);
            this.currentUser = cred.user;
            localStorage.setItem('loci_current_user', JSON.stringify({
                uid: cred.user.uid,
                displayName: cred.user.displayName,
                email: cred.user.email
            }));
            this._notifyAuth(cred.user);
            return cred.user;
        } catch (error) {
            // Kiểm tra qua Firestore
            try {
                const snap = await this._withTimeout(getDoc(doc(db, 'users', 'loci_' + cleanName)), 2000);
                if (snap.exists()) {
                    const cloudUser = snap.data();
                    if (cloudUser.password === btoa(password)) {
                        this.currentUser = cloudUser;
                        accounts[cleanName] = cloudUser;
                        localStorage.setItem('loci_accounts', JSON.stringify(accounts));
                        localStorage.setItem('loci_current_user', JSON.stringify(cloudUser));
                        this._notifyAuth(cloudUser);
                        return cloudUser;
                    }
                }
            } catch (_) {}

            throw new Error('Sai tên đăng nhập hoặc mật khẩu.');
        }
    },

    // Giữ tương thích ngược
    async registerWithEmail(email, password, displayName) {
        return this.registerUser(email, password, displayName);
    },
    async loginWithEmail(email, password) {
        return this.loginUser(email, password);
    },

    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            this.currentUser = result.user;
            
            // Đảm bảo hồ sơ học sinh tồn tại trên Firestore
            const userRef = doc(db, 'users', result.user.uid);
            await setDoc(userRef, {
                uid: result.user.uid,
                displayName: result.user.displayName || '',
                email: result.user.email || '',
                photoURL: result.user.photoURL || '',
                role: 'student',
                lastLogin: serverTimestamp()
            }, { merge: true });

            localStorage.setItem('loci_current_user', JSON.stringify({
                uid: result.user.uid,
                displayName: result.user.displayName,
                email: result.user.email,
                photoURL: result.user.photoURL
            }));
            this._notifyAuth(result.user);
            console.log('[Firebase Auth] Logged in with Google:', result.user.displayName);
            return result.user;
        } catch (error) {
            console.error('[Firebase Auth] Login error:', error);
            throw error;
        }
    },

    async logout() {
        try {
            await signOut(auth);
        } catch (_) {}
        this.currentUser = null;
        localStorage.removeItem('loci_current_user');
        this._notifyAuth(null);
        console.log('[Auth] Đã đăng xuất');
    },

    onAuth(callback) {
        if (callback) this._authListeners.push(callback);
        
        // Lắng nghe Firebase Native Auth
        try {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    this.currentUser = user;
                    this._notifyAuth(user);
                } else if (!this.currentUser || !this.currentUser.isDirect) {
                    const saved = localStorage.getItem('loci_current_user');
                    if (saved) {
                        try {
                            this.currentUser = JSON.parse(saved);
                            this._notifyAuth(this.currentUser);
                        } catch (_) {
                            this._notifyAuth(null);
                        }
                    } else {
                        this.currentUser = null;
                        this._notifyAuth(null);
                    }
                }
            });
        } catch (_) {}

        // Kích hoạt ngay nếu đã có tài khoản lưu từ phiên trước
        const saved = localStorage.getItem('loci_current_user');
        if (saved) {
            try {
                this.currentUser = JSON.parse(saved);
                setTimeout(() => callback && callback(this.currentUser), 50);
            } catch (_) {}
        }
    },

    // --- 2. FIRESTORE DATABASE (TIẾN TRÌNH HỌC TẬP & MỐC KÝ ỨC) ---

    /**
     * Lưu tiến trình học của học sinh vào Firestore
     */
    async saveStudyStats(stats) {
        const uid = this.currentUser ? this.currentUser.uid : 'guest_local';
        // Luôn bảo lưu cục bộ trước tiên
        try {
            localStorage.setItem('loci_study_stats_' + uid, JSON.stringify(stats));
        } catch (_) {}

        try {
            const userRef = doc(db, 'users', uid);
            const payload = {
                stats: {
                    weekMin: stats.weekMin ?? 0,
                    answered: stats.answered ?? 0,
                    streak: stats.streak ?? 0,
                    accuracy: stats.accuracy ?? null,
                    weakPoints: stats.weak ?? [],
                    updatedAt: serverTimestamp()
                }
            };
            if (this.currentUser) {
                payload.displayName = this.currentUser.displayName || '';
                payload.email = this.currentUser.email || '';
                payload.photoURL = this.currentUser.photoURL || '';
            }
            await this._withTimeout(setDoc(userRef, payload, { merge: true }), 1500);
            console.log('[Firestore] Study stats saved successfully for:', uid);
            return true;
        } catch (error) {
            console.warn('[Firestore] Lưu study stats offline/timeout, đã bảo lưu cục bộ.');
            return true; // Vẫn trả về true vì đã lưu cục bộ an toàn
        }
    },

    /**
     * Tải tiến trình học từ Firestore
     */
    async loadStudyStats() {
        const uid = this.currentUser ? this.currentUser.uid : 'guest_local';
        try {
            const userRef = doc(db, 'users', uid);
            const snap = await this._withTimeout(getDoc(userRef), 1500);
            if (snap.exists()) {
                return snap.data().stats || null;
            }
        } catch (error) {
            console.warn('[Firestore] Không tải được stats từ cloud, dùng cục bộ.');
        }
        try {
            const cached = localStorage.getItem('loci_study_stats_' + uid);
            if (cached) return JSON.parse(cached);
        } catch (_) {}
        return null;
    },

    /**
     * Đồng bộ danh sách không gian 360 & mốc gắn tự tạo lên Firestore
     */
    async syncSpaces(spacesList) {
        const uid = this.currentUser ? this.currentUser.uid : 'guest_local';
        try {
            const spacesRef = doc(db, 'user_spaces', uid);
            await this._withTimeout(setDoc(spacesRef, {
                spaces: spacesList || [],
                updatedAt: serverTimestamp()
            }, { merge: true }), 1500);
            console.log('[Firestore] Synced 360 spaces to cloud for:', uid);
            return true;
        } catch (error) {
            console.warn('[Firestore] Sync 360 spaces offline/timeout, dữ liệu đã lưu trong máy.');
            return true;
        }
    },

    /**
     * Tải danh sách không gian 360 đã lưu từ Firestore
     */
    async loadSpaces() {
        try {
            const uid = this.currentUser ? this.currentUser.uid : 'guest_local';
            const spacesRef = doc(db, 'user_spaces', uid);
            const snap = await getDoc(spacesRef);
            if (snap.exists()) {
                return snap.data().spaces || [];
            }
            return [];
        } catch (error) {
            console.error('[Firestore] Error loading spaces:', error);
            return [];
        }
    },

    /**
     * Sinh đường dẫn chia sẻ chuẩn Online
     * Tự động chuyển đổi sang URL GitHub Pages nếu đang chạy ở môi trường file:// hoặc localhost
     * @param {string} shareId 
     * @returns {string} URL chia sẻ công khai
     */
    getShareUrl(shareId) {
        if (!shareId) return '';
        const cleanId = String(shareId).trim();
        const isLocal = typeof window !== 'undefined' && 
            (window.location.protocol === 'file:' || 
             window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1');

        const OFFICIAL_ONLINE_BASE = 'https://vuongnhatm-boop.github.io/nckh-loci-vr/khong_gian_360.html';

        if (isLocal) {
            // Khi mở local từ máy tính (file:// hoặc localhost), link tạo ra sẽ tự động dùng link online để người nhận xem được ngay!
            return `${OFFICIAL_ONLINE_BASE}?share=${encodeURIComponent(cleanId)}`;
        }
        const base = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/khong_gian_360.html');
        return `${base}?share=${encodeURIComponent(cleanId)}`;
    },

    /**
     * Xuất bản & Tạo liên kết chia sẻ Không gian 360° lên Cloud Firestore
     * @param {Object} spaceData Dữ liệu không gian (tên, bài học, mốc, ảnh 360, nodes)
     * @returns {Promise<{success: boolean, shareId: string, shareUrl: string}>}
     */
    async publishShareSpace(spaceData) {
        if (!spaceData) throw new Error('Không có dữ liệu không gian để chia sẻ.');

        try {
            // Tạo ID chia sẻ ngẫu nhiên gọn gàng
            const shareId = spaceData._shareId || ('s360_' + Math.random().toString(36).substring(2, 9));
            const shareRef = doc(db, 'shared_spaces', shareId);

            const authorName = this.currentUser?.displayName || 
                (this.currentUser?.email ? this.currentUser.email.split('@')[0] : 'Học sinh LOCI');
            const authorUid = this.currentUser ? this.currentUser.uid : 'guest';

            const payload = {
                shareId: shareId,
                originalId: spaceData.id || '',
                name: (spaceData.name || 'Không gian 360').trim(),
                lesson: spaceData.lesson || 'bai_6',
                markers: spaceData.markers || (spaceData.nodes ? spaceData.nodes[0]?.markers : {}) || {},
                nodes: (spaceData.nodes || []).map(n => ({
                    id: n.id,
                    name: n.name || '',
                    markers: n.markers || {},
                    links: n.links || []
                })),
                customAnchors: spaceData.customAnchors || [],
                spatial: spaceData.spatial || null,
                image: spaceData.image || spaceData.imageURL || '',
                thumb: spaceData.thumb || spaceData.image || spaceData.imageURL || '',
                authorName: authorName,
                authorUid: authorUid,
                createdAt: spaceData.createdAt || new Date().toISOString(),
                viewsCount: spaceData.viewsCount || 0,
                isPublic: true
            };

            await setDoc(shareRef, payload);
            console.log('[Firestore] Không gian 360 đã được chia sẻ lên cloud với mã:', shareId);

            const shareUrl = this.getShareUrl(shareId);

            return {
                success: true,
                shareId: shareId,
                shareUrl: shareUrl,
                data: payload
            };
        } catch (error) {
            console.error('[Firestore] Lỗi chia sẻ không gian 360:', error);
            throw error;
        }
    },

    /**
     * Tải dữ liệu Không gian 360° được chia sẻ từ mã shareId
     * @param {string} shareId Mã chia sẻ (vd: s360_abc123)
     * @returns {Promise<Object|null>} Dữ liệu không gian hoặc null
     */
    async getSharedSpace(shareId) {
        if (!shareId) return null;
        try {
            const shareRef = doc(db, 'shared_spaces', String(shareId).trim());
            const snap = await this._withTimeout(getDoc(shareRef), 4000);
            if (snap.exists()) {
                const data = snap.data();
                // Tăng lượt xem ngầm
                setDoc(shareRef, { viewsCount: (data.viewsCount || 0) + 1 }, { merge: true }).catch(() => {});
                return data;
            }
            return null;
        } catch (error) {
            console.error('[Firestore] Lỗi tải không gian chia sẻ:', error);
            return null;
        }
    },

    /**
     * Tải danh sách các không gian 360° công khai / chia sẻ từ Cloud Firestore
     * Để người dùng xem và trải nghiệm trực tuyến được ngay mà không chỉ lưu local
     */
    async loadPublicSharedSpaces(limitCount = 20) {
        try {
            const spacesCol = collection(db, 'shared_spaces');
            const snap = await this._withTimeout(getDocs(spacesCol), 3500);
            const list = [];
            snap.forEach(docSnap => {
                const data = docSnap.data();
                if (data && data.name && (data.image || data.thumb || data.imageURL)) {
                    const sid = data.shareId || docSnap.id;
                    list.push({
                        id: sid,
                        shareId: sid,
                        name: data.name,
                        lesson: data.lesson || 'bai_6',
                        authorName: data.authorName || 'Cộng đồng LOCI',
                        authorUid: data.authorUid || '',
                        markers: data.markers || {},
                        nodes: data.nodes || [],
                        customAnchors: data.customAnchors || [],
                        spatial: data.spatial || null,
                        thumb: data.thumb || data.image || data.imageURL || '',
                        image: data.image || data.imageURL || '',
                        imageURL: data.imageURL || (typeof data.image === 'string' && data.image.startsWith('http') ? data.image : null),
                        createdAt: data.createdAt || '',
                        viewsCount: data.viewsCount || 0,
                        _isCloud: true,
                        shareUrl: this.getShareUrl(sid)
                    });
                }
            });
            // Sắp xếp mới nhất lên đầu
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            return list.slice(0, limitCount);
        } catch (error) {
            console.warn('[Firestore] Không thể tải danh sách shared_spaces trực tuyến:', error);
            return [];
        }
    },

    /**
     * Tải toàn bộ danh sách tài khoản học sinh & tiến độ học tập từ Firestore
     * Phục vụ trang Quản Trị Giáo Viên (Mã bí mật "quanli")
     */
    async getAllUsersProgress() {
        try {
            const usersCol = collection(db, 'users');
            const snap = await this._withTimeout(getDocs(usersCol), 4000);
            const list = [];
            snap.forEach(docSnap => {
                const data = docSnap.data();
                if (data) {
                    list.push({
                        uid: docSnap.id,
                        ...data
                    });
                }
            });
            return list;
        } catch (error) {
            console.warn('[Firestore] Không thể tải danh sách users tiến độ:', error);
            return [];
        }
    },

    // --- 2b. ADMIN CONSOLE (trang quan_tri.html, yêu cầu role = 'admin') ---

    async isAdminUser(uid) {
        if (!uid) return false;
        try {
            const snap = await this._withTimeout(getDoc(doc(db, 'users', uid)), 4000);
            return snap.exists() && snap.data().role === 'admin';
        } catch (_) {
            return false;
        }
    },

    async adminList(colName, max = 300, orderField = null) {
        const colRef = collection(db, colName);
        const q = orderField
            ? query(colRef, orderBy(orderField, 'desc'), limit(max))
            : query(colRef, limit(max));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(d => list.push({ _id: d.id, ...d.data() }));
        return list;
    },

    async adminUpdate(colName, id, patch) {
        await updateDoc(doc(db, colName, id), patch);
    },

    async adminDelete(colName, id) {
        await deleteDoc(doc(db, colName, id));
    },

    // --- 3. FIREBASE STORAGE (LƯU TRỮ ẢNH & TÀI LIỆU) ---

    /**
     * Tải file ảnh hoặc tài liệu lên Firebase Storage
     * @param {File|Blob} file 
     * @param {string} customPath (optional)
     * @returns {Promise<string>} Download URL
     */
    async uploadFile(file, customPath) {
        try {
            const uid = this.currentUser ? this.currentUser.uid : 'public';
            const timestamp = Date.now();
            const fileName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_') : `upload_${timestamp}.jpg`;
            const filePath = customPath || `users/${uid}/uploads/${timestamp}_${fileName}`;
            const storageRef = ref(storage, filePath);

            console.log(`[Firebase Storage] Uploading to ${filePath}...`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            console.log('[Firebase Storage] Upload success! URL:', downloadUrl);
            return downloadUrl;
        } catch (error) {
            console.error('[Firebase Storage] Upload failed:', error);
            throw error;
        }
    },

    // --- HỆ THỐNG LƯU TRỮ ẢNH MIỄN PHÍ QUA IMGBB (TRẠM TRUNG CHUYỂN) ---
    /**
     * Tải ảnh lên ImgBB và trả về Link trực tiếp (Miễn phí, thay thế Firebase Storage)
     * @param {string|File} imageInput Chuỗi Base64 hoặc File ảnh
     * @returns {Promise<string>} Link ảnh công khai
     */
    async uploadImageToImgBB(imageInput) {
        // API Key của bạn
        const IMGBB_API_KEY = '9459e410dfc323da982a3c3319ab1a79'; 
        
        try {
            const formData = new FormData();
            
            // Nếu là Base64 DataURL (từ Canvas)
            if (typeof imageInput === 'string' && imageInput.startsWith('data:image')) {
                // Tách bỏ phần "data:image/jpeg;base64,"
                const base64Data = imageInput.split(',')[1];
                formData.append('image', base64Data);
            } else {
                // Nếu là File trực tiếp
                formData.append('image', imageInput);
            }

            console.log('[ImgBB] Đang đẩy ảnh lên máy chủ...');
            const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
            const timer = ctrl ? setTimeout(() => ctrl.abort(), 30000) : null;
            let response;
            try {
                response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData,
                    signal: ctrl ? ctrl.signal : undefined
                });
            } finally {
                if (timer) clearTimeout(timer);
            }

            const data = await response.json();
            if (data.success) {
                console.log('[ImgBB] Tải ảnh thành công! Link:', data.data.url);
                return data.data.url; // Trả về link trực tiếp
            } else {
                throw new Error(data.error.message);
            }
        } catch (error) {
            console.error('[ImgBB] Lỗi khi tải ảnh:', error);
            throw error;
        }
    },

    /**
     * Tải ảnh dạng Base64/DataURL lên Firebase Storage (hoặc Cloud CDN ImgBB)
     */
    async uploadDataUrl(dataUrl, folder = 'panoramas') {
        if (!dataUrl) return null;
        if (typeof dataUrl === 'string' && dataUrl.startsWith('http')) return dataUrl;

        // 1. Thử tải lên Firebase Storage
        try {
            const uid = this.currentUser ? this.currentUser.uid : 'public';
            const timestamp = Date.now();
            const filePath = `shared/${folder}/img_${timestamp}_${Math.random().toString(36).substring(2,7)}.jpg`;
            const storageRef = ref(storage, filePath);

            console.log(`[Firebase Storage] Uploading dataURL to ${filePath}...`);
            // Chặn retry ngầm của SDK (mặc định tới ~2 phút) làm treo UI
            const snapshot = await this._withTimeout(uploadString(storageRef, dataUrl, 'data_url'), 12000);
            const downloadUrl = await this._withTimeout(getDownloadURL(snapshot.ref), 8000);
            console.log('[Firebase Storage] DataURL uploaded! URL:', downloadUrl);
            return downloadUrl;
        } catch (error) {
            console.warn('[Firebase Storage] Upload dataUrl failed, thử fallback sang ImgBB:', error);
            // 2. Tự động fallback sang ImgBB CDN
            try {
                return await this.uploadImageToImgBB(dataUrl);
            } catch (imgbbErr) {
                console.error('[Cloud Storage] Cả Firebase và ImgBB đều không thành công:', imgbbErr);
                throw imgbbErr;
            }
        }
    },

    /**
     * Lưu lịch sử trò chuyện AI vào cơ sở dữ liệu
     */
    async saveChatSessions(sessions) {
        try {
            const uid = this.currentUser ? this.currentUser.uid : 'guest_local';
            const chatRef = doc(db, 'user_chats', uid);
            await this._withTimeout(setDoc(chatRef, {
                sessions: sessions || [],
                updatedAt: serverTimestamp()
            }, { merge: true }), 1500);
            return true;
        } catch (error) {
            console.warn('[Firestore] Lưu lịch sử chat offline/timeout, đã bảo lưu cục bộ.');
            return false;
        }
    },

    /**
     * Tải lịch sử trò chuyện AI từ cơ sở dữ liệu
     */
    async loadChatSessions() {
        try {
            const uid = this.currentUser ? this.currentUser.uid : 'guest_local';
            const chatRef = doc(db, 'user_chats', uid);
            const snap = await this._withTimeout(getDoc(chatRef), 1500);
            if (snap.exists()) {
                return snap.data().sessions || [];
            }
        } catch (error) {
            console.warn('[Firestore] Không tải được lịch sử chat từ cloud:', error);
        }
        return null;
    },

    /**
     * Yêu cầu quyền gửi thông báo (Web Push Notification) và lấy Token FCM
     */
    async requestNotificationPermission(vapidKey = null) {
        if (!messaging) {
            return { token: null, error: "Trình duyệt của bạn (hoặc chế độ ẩn danh) không hỗ trợ Web Push/Service Worker. Vui lòng mở bằng Chrome/Edge bình thường." };
        }
        
        if (window.location.protocol === 'file:') {
            return { token: null, error: "Push Notification không hoạt động khi mở file trực tiếp (file://). Vui lòng dùng Live Server hoặc localhost." };
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log("Đã cấp quyền gửi thông báo (Notification Granted). Đang lấy Token...");
                try {
                    const currentToken = await getToken(messaging, { 
                        vapidKey: vapidKey 
                    });
                    
                    if (currentToken) {
                        console.log("FCM Token:", currentToken);
                        if (this.currentUser) {
                            await setDoc(doc(db, "users", this.currentUser.uid, "fcmTokens", currentToken), {
                                token: currentToken,
                                updatedAt: new Date().toISOString(),
                                deviceInfo: navigator.userAgent
                            }, { merge: true });
                        }
                        return { token: currentToken, error: null };
                    } else {
                        return { token: null, error: "Không thể khởi tạo Token từ Firebase. Vui lòng kiểm tra lại cấu hình Firebase VAPID Key." };
                    }
                } catch (tokenErr) {
                    console.error("Lỗi getToken:", tokenErr);
                    return { token: null, error: "Lỗi tạo Token FCM: " + tokenErr.message };
                }
            } else if (permission === 'denied') {
                return { token: null, error: "Bạn đã vô tình bấm CHẶN quyền thông báo trước đó. Vui lòng click vào biểu tượng 🔒 Ổ Khóa trên thanh địa chỉ trình duyệt, bật quyền Notifications (Thông báo) và tải lại trang." };
            } else {
                return { token: null, error: "Bạn đã bỏ qua việc cấp quyền thông báo." };
            }
        } catch (err) {
            console.error("Lỗi khi xin quyền:", err);
            return { token: null, error: "Lỗi hệ thống khi xin quyền: " + err.message };
        }
    },

    /**
     * Lắng nghe thông báo khi ứng dụng đang mở (Foreground)
     */
    onMessageListener(callback) {
        if (!messaging) return;
        return onMessage(messaging, (payload) => {
            console.log("Nhận được thông báo Foreground:", payload);
            if (callback) callback(payload);
        });
    }
};

// Export to window global for easy access in HTML pages
if (typeof window !== 'undefined') {
    window.LociFirebase = LociFirebase;
}

export default LociFirebase;
