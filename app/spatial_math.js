/* LOCI spatial math — QR pose, world projection (Z-up world, cm units) */
(function (root) {
    'use strict';

    const D2R = Math.PI / 180;
    const R2D = 180 / Math.PI;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const norm = v => {
        const L = Math.hypot(v[0], v[1], v[2]) || 1;
        return [v[0] / L, v[1] / L, v[2] / L];
    };
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];

    const mul3 = (A, B) => [0, 1, 2].map(i => [0, 1, 2].map(j =>
        A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]
    ));
    const transpose = A => [0, 1, 2].map(i => [0, 1, 2].map(j => A[j][i]));
    const mulVec = (A, v) => [
        A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2],
        A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2],
        A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2]
    ];

    const rotX = t => [[1, 0, 0], [0, Math.cos(t), -Math.sin(t)], [0, Math.sin(t), Math.cos(t)]];
    const rotY = t => [[Math.cos(t), 0, Math.sin(t)], [0, 1, 0], [-Math.sin(t), 0, Math.cos(t)]];
    const rotZ = t => [[Math.cos(t), -Math.sin(t), 0], [Math.sin(t), Math.cos(t), 0], [0, 0, 1]];

    const normalizeAngle = a => {
        while (a > Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        return a;
    };

    // marker frame (X right, Y up, Z out of wall) -> world (X right, Y into wall, Z up)
    const R_WM = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];

    function solveLinear(A, b) {
        const n = b.length;
        const M = A.map((row, i) => row.slice().concat([b[i]]));
        for (let col = 0; col < n; col++) {
            let piv = col;
            for (let r = col + 1; r < n; r++) {
                if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
            }
            if (Math.abs(M[piv][col]) < 1e-12) return null;
            if (piv !== col) { const t = M[piv]; M[piv] = M[col]; M[col] = t; }
            const d = M[col][col];
            for (let r = col + 1; r < n; r++) {
                const f = M[r][col] / d;
                if (!f) continue;
                for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
            }
        }
        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let s = M[i][n];
            for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c];
            x[i] = s / M[i][i];
        }
        return x;
    }

    // dst ~ H * [X, Y, 1]
    function homographyFrom4(src, dst) {
        const A = [];
        const b = [];
        for (let i = 0; i < 4; i++) {
            const X = src[i][0], Y = src[i][1];
            const u = dst[i][0], v = dst[i][1];
            A.push([X, Y, 1, 0, 0, 0, -u * X, -u * Y]); b.push(u);
            A.push([0, 0, 0, X, Y, 1, -v * X, -v * Y]); b.push(v);
        }
        const h = solveLinear(A, b);
        if (!h) return null;
        return [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], 1]];
    }

    function projectMarkerPoint(R, t, p) {
        const q = mulVec(R, p);
        return [q[0] + t[0], q[1] + t[1], q[2] + t[2]];
    }

    function projectCam(pCam, f, cx, cy) {
        if (pCam[2] <= 0.001) return null;
        return [cx + f * pCam[0] / pCam[2], cy + f * pCam[1] / pCam[2]];
    }

    /**
     * corners: [[u,v] x4] theo thứ tự TL, TR, BR, BL (ảnh)
     * Trả về R (marker->camera), t (tâm QR trong hệ camera, cm), sai số reprojection (px)
     */
    function poseFromQRCorners(corners, sizeCm, f, cx, cy) {
        const s = sizeCm / 2;
        const obj = [[-s, s], [s, s], [s, -s], [-s, -s]];
        const H = homographyFrom4(obj, corners);
        if (!H) return null;

        const col = c => [
            (H[0][c] - cx * H[2][c]) / f,
            (H[1][c] - cy * H[2][c]) / f,
            H[2][c]
        ];
        const m1 = col(0), m2 = col(1), m3 = col(2);
        const n1 = Math.hypot(m1[0], m1[1], m1[2]);
        const n2 = Math.hypot(m2[0], m2[1], m2[2]);
        if (!n1 || !n2 || !isFinite(n1) || !isFinite(n2)) return null;

        const lambda = 2 / (n1 + n2);
        const r1 = scale(m1, lambda);
        const r2 = scale(m2, lambda);
        const t = scale(m3, lambda);
        if (t[2] <= 0) return null;

        const u1 = norm(r1);
        const u2 = norm(sub(r2, scale(u1, dot(u1, r2))));
        const u3 = cross(u1, u2);
        const R = [
            [u1[0], u2[0], u3[0]],
            [u1[1], u2[1], u3[1]],
            [u1[2], u2[2], u3[2]]
        ];

        let sum = 0;
        for (let i = 0; i < 4; i++) {
            const p = projectMarkerPoint(R, t, [obj[i][0], obj[i][1], 0]);
            const uv = projectCam(p, f, cx, cy);
            if (!uv) return null;
            sum += (uv[0] - corners[i][0]) ** 2 + (uv[1] - corners[i][1]) ** 2;
        }
        return { R, t, reproj: Math.sqrt(sum / 4) };
    }

    function markerToWorld(R_mc, t_c) {
        const R_cm = transpose(R_mc);
        const C_m = scale(mulVec(R_cm, t_c), -1);
        return {
            R: mul3(R_WM, R_cm),
            C: mulVec(R_WM, C_m)
        };
    }

    function worldToCamera(pose, P) {
        return mulVec(transpose(pose.R), sub(P, pose.C));
    }

    function poseForwardWorld(pose) {
        return [pose.R[0][2], pose.R[1][2], pose.R[2][2]];
    }

    function projectWorld(pose, P, f, cx, cy) {
        return projectCam(worldToCamera(pose, P), f, cx, cy);
    }

    // W3C deviceorientation -> rotation device->earth (Z up, Y north)
    function sensorMatrix(alpha, beta, gamma) {
        return mul3(mul3(rotZ((alpha || 0) * D2R), rotX((beta || 0) * D2R)), rotY((gamma || 0) * D2R));
    }

    function sensorForward(alpha, beta, gamma) {
        const M = sensorMatrix(alpha, beta, gamma);
        return [-M[0][2], -M[1][2], -M[2][2]];
    }

    function sensorYaw(alpha, beta, gamma) {
        const f = sensorForward(alpha, beta, gamma);
        return Math.atan2(f[0], f[1]);
    }

    function estimateFocalPx(qrPixelSides, sizeCm, distanceCm) {
        const sides = qrPixelSides.filter(v => v > 1);
        if (!sides.length || !(sizeCm > 0) || !(distanceCm > 0)) return null;
        const w = sides.reduce((a, b) => a + b, 0) / sides.length;
        return w * distanceCm / sizeCm;
    }

    const api = {
        D2R, R2D, clamp, norm, sub, add, scale, dot, cross,
        mul3, transpose, mulVec, rotX, rotY, rotZ,
        normalizeAngle, R_WM,
        solveLinear, homographyFrom4,
        poseFromQRCorners, markerToWorld, worldToCamera,
        projectCam, projectWorld, poseForwardWorld,
        sensorMatrix, sensorForward, sensorYaw,
        estimateFocalPx
    };

    root.LociSpatialMath = api;
    if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
