importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyA-WNTBsEGZRBfTkaVduWiMjdj-XyGW2n0",
  authDomain: "loci-b04a7.firebaseapp.com",
  projectId: "loci-b04a7",
  storageBucket: "loci-b04a7.firebasestorage.app",
  messagingSenderId: "518163277905",
  appId: "1:518163277905:web:50db730ade28ac06e07070",
  measurementId: "G-PRQ1ZQ3GN9"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[Service Worker] Nhận được tin nhắn nền: ', payload);
    const notificationTitle = payload.notification?.title || 'LOCI 360 Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'Bạn có một thông báo mới từ không gian 360.',
        icon: payload.notification?.image || '/favicon.ico',
        badge: '/favicon.ico',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
