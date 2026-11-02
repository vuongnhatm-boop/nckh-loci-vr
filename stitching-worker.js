/**
 * ============================================================================
 * LOCI EDU — STITCHING WEB WORKER (stitching-worker.js)
 * ĐỢT 4 / 4: CHUYỂN TOÀN BỘ PIPELINE STITCHING NẶNG SANG LUỒNG NGẦM (BACKGROUND)
 * ============================================================================
 * 
 * ĐẶC TÍNH KỸ THUẬT:
 * 1. Thuần Javascript tính toán toán học & xử lý mảng (TypedArrays: Float32Array, Uint8ClampedArray).
 * 2. TUYỆT ĐỐI KHÔNG chứa DOM, Three.js, hay Canvas/OffscreenCanvas để đảm bảo 100% tương thích
 *    với Safari iOS (nền tảng chụp ảnh chính) và tránh rò rỉ bộ nhớ WebGL/Canvas context.
 * 3. Giao tiếp qua `postMessage` bằng Transferable Objects (ArrayBuffer zero-copy) để đạt hiệu năng tối đa.
 * 4. Chứa toàn bộ logic:
 *    - Đợt 2: Gain Compensation (cân bằng phơi sáng qua log-ratio & gradient descent)
 *    - Đợt 3: Burt-Adelson Multi-Band Blending (Laplacian & Gaussian Pyramid)
 *    - Đợt 4: Diffusion Pole Fill (khuếch tán biên lấp cực đỉnh/đáy tự nhiên)
 * ============================================================================
 */

// Phòng vệ an toàn tuyệt đối cho Safari WebKit iOS:
// Đảm bảo biến frameBoxes luôn tồn tại ở scope toàn cục và gắn vào self
var frameBoxes = [];
if (typeof self !== 'undefined') {
    self.frameBoxes = frameBoxes;
}

// Hằng số lượng giác & chuyển đổi toạ độ 3D
const D2R = Math.PI / 180;

const Rz = a => [
    [Math.cos(a), -Math.sin(a), 0],
    [Math.sin(a),  Math.cos(a), 0],
    [0,            0,           1]
];

const Rx = a => [
    [1, 0,            0          ],
    [0, Math.cos(a), -Math.sin(a)],
    [0, Math.sin(a),  Math.cos(a)]
];

const Ry = a => [
    [ Math.cos(a), 0, Math.sin(a)],
    [ 0,           1, 0          ],
    [-Math.sin(a), 0, Math.cos(a)]
];

function mul(A, B) {
    const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            C[r][c] = A[r][0] * B[0][c] + A[r][1] * B[1][c] + A[r][2] * B[2][c];
        }
    }
    return C;
}

const fwdOf = M => [-M[0][2], -M[1][2], -M[2][2]];
const dirOf = (lon, lat) => [Math.cos(lat) * Math.sin(lon), Math.cos(lat) * Math.cos(lon), Math.sin(lat)];

/* ============================================================================
   1. GAIN COMPENSATION (CÂN BẰNG PHƠI SÁNG ĐỢT 2)
   ============================================================================ */

function buildOverlapPairs(frames, fovOrStepAngles = 65, optionalFov = 65) {
    const fovDeg = (typeof fovOrStepAngles === 'number') ? fovOrStepAngles : (typeof optionalFov === 'number' ? optionalFov : 65);
    const fovRad = fovDeg * D2R;
    const maxCenterAngle = fovRad * 0.95;
    const pairs = [];
    const centers = frames.map(f => fwdOf(f.M));

    for (let i = 0; i < frames.length; i++) {
        for (let j = i + 1; j < frames.length; j++) {
            const ci = centers[i];
            const cj = centers[j];
            const dot = Math.max(-1, Math.min(1, ci[0] * cj[0] + ci[1] * cj[1] + ci[2] * cj[2]));
            const angle = Math.acos(dot);

            if (angle > 0.05 && angle < maxCenterAngle) {
                let mid = [ci[0] + cj[0], ci[1] + cj[1], ci[2] + cj[2]];
                const midLen = Math.hypot(mid[0], mid[1], mid[2]);
                if (midLen < 0.001) continue;
                mid = [mid[0] / midLen, mid[1] / midLen, mid[2] / midLen];

                let u = [cj[0] - dot * ci[0], cj[1] - dot * ci[1], cj[2] - dot * ci[2]];
                const uLen = Math.hypot(u[0], u[1], u[2]);
                if (uLen < 0.001) continue;
                u = [u[0] / uLen, u[1] / uLen, u[2] / uLen];

                let v = [
                    ci[1] * cj[2] - ci[2] * cj[1],
                    ci[2] * cj[0] - ci[0] * cj[2],
                    ci[0] * cj[1] - ci[1] * cj[0]
                ];
                const vLen = Math.hypot(v[0], v[1], v[2]);
                if (vLen < 0.001) continue;
                v = [v[0] / vLen, v[1] / vLen, v[2] / vLen];

                const spanU = (fovRad - angle) * 0.45;
                const spanV = fovRad * 0.35;
                const samplePoints = [];
                const GRID_SIZE = 8;

                for (let gu = 0; gu < GRID_SIZE; gu++) {
                    const fu = ((gu + 0.5) / GRID_SIZE - 0.5) * 2 * spanU;
                    for (let gv = 0; gv < GRID_SIZE; gv++) {
                        const fv = ((gv + 0.5) / GRID_SIZE - 0.5) * 2 * spanV;

                        const px = mid[0] + fu * u[0] + fv * v[0];
                        const py = mid[1] + fu * u[1] + fv * v[1];
                        const pz = mid[2] + fu * u[2] + fv * v[2];
                        const pLen = Math.hypot(px, py, pz);
                        if (pLen < 0.001) continue;

                        const nx = px / pLen, ny = py / pLen, nz = pz / pLen;
                        const phi = Math.asin(Math.max(-1, Math.min(1, nz)));
                        const theta = Math.atan2(nx, ny);

                        samplePoints.push({ theta, phi });
                    }
                }

                pairs.push({ i, j, samplePoints });
            }
        }
    }
    return pairs;
}

function sampleLuminance(frameImageData, theta, phi, frameOrientation, fovDeg = 65, vw = null, vh = null) {
    let M = frameOrientation;
    if (frameOrientation && frameOrientation.M) {
        if (!vw) vw = frameOrientation.vw;
        if (!vh) vh = frameOrientation.vh;
        M = frameOrientation.M;
    }
    if (!vw || !vh || !M) return null;

    const cl = Math.cos(phi);
    const dx = cl * Math.sin(theta);
    const dy = cl * Math.cos(theta);
    const dz = Math.sin(phi);

    const depth = -(M[0][2] * dx + M[1][2] * dy + M[2][2] * dz);
    if (depth < 0.1) return null;

    const sx = M[0][0] * dx + M[1][0] * dy + M[2][0] * dz;
    const sy = M[0][1] * dx + M[1][1] * dy + M[2][1] * dz;

    const f = (Math.max(vw, vh) * 0.5) / Math.tan(fovDeg * D2R * 0.5);
    const hw = vw * 0.5;
    const hh = vh * 0.5;

    const u = hw + f * sx / depth;
    const v = hh - f * sy / depth;

    if (u < 3 || v < 3 || u >= vw - 3 || v >= vh - 3) return null;

    const o = ((Math.floor(v) * vw) + Math.floor(u)) * 4;
    const r = frameImageData[o];
    const g = frameImageData[o + 1];
    const b = frameImageData[o + 2];

    return 0.299 * r + 0.587 * g + 0.114 * b;
}

function estimateExposureGains(frames, overlapPairs, fovDeg = 65, config = {}) {
    const N = frames.length;
    if (N < 2) return frames.map(() => 1.0);

    const rawPixels = frames.map(f => {
        if (f.px) return f.px;
        if (f.buffer) return new Uint8ClampedArray(f.buffer);
        return null;
    });

    const constraints = [];

    for (const pair of overlapPairs) {
        const { i, j, samplePoints } = pair;
        const fi = frames[i], fj = frames[j];
        const pxI = rawPixels[i], pxJ = rawPixels[j];
        if (!pxI || !pxJ) continue;

        let sumLogRatio = 0;
        let count = 0;

        for (const pt of samplePoints) {
            const lumI = sampleLuminance(pxI, pt.theta, pt.phi, fi.M, fovDeg, fi.vw, fi.vh);
            if (lumI === null) continue;

            const lumJ = sampleLuminance(pxJ, pt.theta, pt.phi, fj.M, fovDeg, fj.vw, fj.vh);
            if (lumJ === null) continue;

            if (lumI < 5 || lumI > 250 || lumJ < 5 || lumJ > 250) continue;

            sumLogRatio += (Math.log(lumJ) - Math.log(lumI));
            count++;
        }

        if (count >= 8) {
            const d_ij = sumLogRatio / count;
            constraints.push({
                i,
                j,
                d: d_ij,
                weight: Math.min(1.0, count / 40)
            });
        }
    }

    if (constraints.length < 3) {
        return frames.map(() => 1.0);
    }

    const e = new Float32Array(N);
    const lr = config.gainAlpha || 0.05;
    const ITERS = config.gainIters || 250;

    for (let iter = 0; iter < ITERS; iter++) {
        const grad = new Float32Array(N);

        for (const c of constraints) {
            const diff = (e[c.i] - e[c.j]) - c.d;
            const step = c.weight * diff;
            grad[c.i] += step;
            grad[c.j] -= step;
        }

        for (let i = 0; i < N; i++) {
            e[i] -= lr * grad[i];
        }

        let sumE = 0;
        for (let i = 0; i < N; i++) sumE += e[i];
        const meanE = sumE / N;
        for (let i = 0; i < N; i++) e[i] -= meanE;
    }

    const rawGains = new Float32Array(N);
    let sumG = 0;
    for (let i = 0; i < N; i++) {
        rawGains[i] = Math.exp(e[i]);
        sumG += rawGains[i];
    }

    const meanGain = sumG / N;
    const finalGains = [];
    for (let i = 0; i < N; i++) {
        const g = Math.max(0.4, Math.min(2.5, rawGains[i] / meanGain));
        finalGains.push(g);
    }

    return finalGains;
}

/* ============================================================================
   2. BURT-ADELSON MULTI-BAND PYRAMID BLENDING (ĐỢT 3)
   ============================================================================ */

// ĐỢT 6: Làm mờ nhân tử [1,4,6,4,1]/16 tách 2 pass 1D trước khi hạ mẫu.
// Thiếu bước low-pass này, tần số cao vượt Nyquist rò sang cấp tháp thấp hơn
// gây alias ở band Laplacian → seam mờ ẩn lộ lại ở vùng texture cao sau khi collapse.
function binomialBlur5(src, srcW, srcH) {
    const N = srcW * srcH;
    const tmp = new Float32Array(N);
    const dst = new Float32Array(N);

    // Pass ngang (biên kẹp — vùng ngoài box không có dữ liệu)
    for (let y = 0; y < srcH; y++) {
        const row = y * srcW;
        for (let x = 0; x < srcW; x++) {
            const xm2 = Math.max(0, x - 2), xm1 = Math.max(0, x - 1);
            const xp1 = Math.min(srcW - 1, x + 1), xp2 = Math.min(srcW - 1, x + 2);
            tmp[row + x] = (src[row + xm2] + 4 * src[row + xm1] + 6 * src[row + x] + 4 * src[row + xp1] + src[row + xp2]) * (1 / 16);
        }
    }

    // Pass dọc
    for (let y = 0; y < srcH; y++) {
        const ym2 = Math.max(0, y - 2) * srcW;
        const ym1 = Math.max(0, y - 1) * srcW;
        const yc = y * srcW;
        const yp1 = Math.min(srcH - 1, y + 1) * srcW;
        const yp2 = Math.min(srcH - 1, y + 2) * srcW;
        for (let x = 0; x < srcW; x++) {
            dst[yc + x] = (tmp[ym2 + x] + 4 * tmp[ym1 + x] + 6 * tmp[yc + x] + 4 * tmp[yp1 + x] + tmp[yp2 + x]) * (1 / 16);
        }
    }
    return dst;
}

function downsamplePyramidLevel(src, srcW, srcH) {
    const blurred = binomialBlur5(src, srcW, srcH);
    const dstW = srcW >> 1;
    const dstH = srcH >> 1;
    const dst = new Float32Array(dstW * dstH);

    for (let dy = 0; dy < dstH; dy++) {
        const sy = dy << 1;
        const row0 = sy * srcW;
        const row1 = (sy + 1) * srcW;
        const dRow = dy * dstW;

        for (let dx = 0; dx < dstW; dx++) {
            const sx = dx << 1;
            dst[dRow + dx] = 0.25 * (
                blurred[row0 + sx] +
                blurred[row0 + sx + 1] +
                blurred[row1 + sx] +
                blurred[row1 + sx + 1]
            );
        }
    }
    return dst;
}

function upsampleBilinear(src, srcW, srcH, dstW, dstH) {
    const dst = new Float32Array(dstW * dstH);
    const scaleX = srcW / dstW;
    const scaleY = srcH / dstH;

    for (let dy = 0; dy < dstH; dy++) {
        const sy = (dy + 0.5) * scaleY - 0.5;
        const y0 = Math.max(0, Math.min(srcH - 1, Math.floor(sy)));
        const y1 = Math.max(0, Math.min(srcH - 1, y0 + 1));
        const fy = Math.max(0, Math.min(1, sy - y0));
        const oneMinusFy = 1.0 - fy;

        const row0 = y0 * srcW;
        const row1 = y1 * srcW;
        const dRow = dy * dstW;

        for (let dx = 0; dx < dstW; dx++) {
            const sx = (dx + 0.5) * scaleX - 0.5;
            const x0 = Math.max(0, Math.min(srcW - 1, Math.floor(sx)));
            const x1 = Math.max(0, Math.min(srcW - 1, x0 + 1));
            const fx = Math.max(0, Math.min(1, sx - x0));

            const top = (1.0 - fx) * src[row0 + x0] + fx * src[row0 + x1];
            const bot = (1.0 - fx) * src[row1 + x0] + fx * src[row1 + x1];

            dst[dRow + dx] = oneMinusFy * top + fy * bot;
        }
    }
    return dst;
}

function buildGaussianPyramid(src, width, height, levels = 4) {
    const pyr = new Array(levels);
    pyr[0] = src;
    for (let l = 1; l < levels; l++) {
        const wPrev = width >> (l - 1);
        const hPrev = height >> (l - 1);
        pyr[l] = downsamplePyramidLevel(pyr[l - 1], wPrev, hPrev);
    }
    return pyr;
}

function buildLaplacianPyramid(src, width, height, levels = 4) {
    const gauss = buildGaussianPyramid(src, width, height, levels);
    const lap = new Array(levels);

    for (let l = 0; l < levels - 1; l++) {
        const wL = width >> l;
        const hL = height >> l;
        const wNext = width >> (l + 1);
        const hNext = height >> (l + 1);

        const up = upsampleBilinear(gauss[l + 1], wNext, hNext, wL, hL);
        const diff = new Float32Array(wL * hL);
        const cur = gauss[l];

        const boost = (l === 0) ? 1.15 : (l === 1 ? 1.06 : 1.0);
        for (let i = 0; i < diff.length; i++) {
            diff[i] = (cur[i] - up[i]) * boost;
        }
        lap[l] = diff;
    }

    lap[levels - 1] = gauss[levels - 1];
    return lap;
}

function accumulateIntoGlobalBuffer(globalPyramid, localLapR, localLapG, localLapB, localGaussW, boxX, boxY, boxW, boxH, OW, OH, levels = 4) {
    for (let l = 0; l < levels; l++) {
        const gw = OW >> l;
        const gh = OH >> l;
        const lw = boxW >> l;
        const lh = boxH >> l;

        const startX = (boxX >> l);
        const startY = (boxY >> l);

        const gR = globalPyramid[l].R;
        const gG = globalPyramid[l].G;
        const gB = globalPyramid[l].B;
        const gW = globalPyramid[l].W;

        const lR = localLapR[l];
        const lG = localLapG[l];
        const lB = localLapB[l];
        const lW = localGaussW[l];

        for (let ly = 0; ly < lh; ly++) {
            const gy = startY + ly;
            if (gy < 0 || gy >= gh) continue;

            const gRow = gy * gw;
            const lRow = ly * lw;

            for (let lx = 0; lx < lw; lx++) {
                const gx = (startX + lx) % gw;
                const lIdx = lRow + lx;
                const w = lW[lIdx];
                if (w <= 0.00001) continue;

                const effW = (l === 0) ? Math.pow(w, 2.4) : w;

                const gIdx = gRow + gx;
                gR[gIdx] += lR[lIdx] * effW;
                gG[gIdx] += lG[lIdx] * effW;
                gB[gIdx] += lB[lIdx] * effW;
                gW[gIdx] += effW;
            }
        }
    }
}

function collapsePyramid(globalPyramid, OW, OH, levels = 4) {
    let curR = globalPyramid[levels - 1].R;
    let curG = globalPyramid[levels - 1].G;
    let curB = globalPyramid[levels - 1].B;

    for (let l = levels - 2; l >= 0; l--) {
        const wNext = OW >> (l + 1);
        const hNext = OH >> (l + 1);
        const wL = OW >> l;
        const hL = OH >> l;

        const upR = upsampleBilinear(curR, wNext, hNext, wL, hL);
        const upG = upsampleBilinear(curG, wNext, hNext, wL, hL);
        const upB = upsampleBilinear(curB, wNext, hNext, wL, hL);

        const lapR = globalPyramid[l].R;
        const lapG = globalPyramid[l].G;
        const lapB = globalPyramid[l].B;

        const nextR = new Float32Array(wL * hL);
        const nextG = new Float32Array(wL * hL);
        const nextB = new Float32Array(wL * hL);

        for (let k = 0; k < nextR.length; k++) {
            nextR[k] = upR[k] + lapR[k];
            nextG[k] = upG[k] + lapG[k];
            nextB[k] = upB[k] + lapB[k];
        }

        curR = nextR;
        curG = nextG;
        curB = nextB;
    }

    return {
        R: curR,
        G: curG,
        B: curB,
        W: globalPyramid[0].W
    };
}

/* ============================================================================
   3. DIFFUSION POLE FILL (LẤP CỰC KHUẾCH TÁN BIÊN ĐỢT 4)
   ============================================================================ */

/**
 * Thuật toán khuếch tán đơn giản lấp vùng cực (Zenith/Nadir):
 * Lặp `iterations` vòng. Ở mỗi vòng, với pixel thuộc vùng trống (alpha < 10),
 * lấy trung bình màu các lân cận đã có dữ liệu (có nối vòng x-modulo).
 */
function applyDiffusionPoleFill(data, OW, OH, iterations = 60) {
    const N = OW * OH;
    const mask = new Uint8Array(N);

    let hasEmptyTop = false;
    let hasEmptyBot = false;
    let topMaxY = 0;
    let botMinY = OH - 1;

    for (let k = 0; k < N; k++) {
        if (data[k * 4 + 3] >= 10) {
            mask[k] = 1;
        } else {
            const y = (k / OW) | 0;
            if (y < (OH >> 1)) {
                hasEmptyTop = true;
                if (y > topMaxY) topMaxY = y;
            } else {
                hasEmptyBot = true;
                if (y < botMinY) botMinY = y;
            }
        }
    }

    if (!hasEmptyTop && !hasEmptyBot) return;

    topMaxY = Math.min((OH >> 1) - 1, topMaxY + 2);
    botMinY = Math.max((OH >> 1), botMinY - 2);

    for (let iter = 0; iter < iterations; iter++) {
        const updates = [];

        // 1. Quét vùng cực trên
        if (hasEmptyTop) {
            for (let y = 0; y <= topMaxY; y++) {
                const row = y * OW;
                for (let x = 0; x < OW; x++) {
                    const k = row + x;
                    if (mask[k] === 1) continue;

                    let sumR = 0, sumG = 0, sumB = 0, count = 0;

                    const left = row + ((x - 1 + OW) % OW);
                    if (mask[left]) {
                        const o = left * 4;
                        sumR += data[o]; sumG += data[o + 1]; sumB += data[o + 2];
                        count++;
                    }
                    const right = row + ((x + 1) % OW);
                    if (mask[right]) {
                        const o = right * 4;
                        sumR += data[o]; sumG += data[o + 1]; sumB += data[o + 2];
                        count++;
                    }
                    if (y > 0) {
                        const up = (y - 1) * OW + x;
                        if (mask[up]) {
                            const o = up * 4;
                            sumR += data[o]; sumG += data[o + 1]; sumB += data[o + 2];
                            count++;
                        }
                    }
                    if (y < OH - 1) {
                        const down = (y + 1) * OW + x;
                        if (mask[down]) {
                            const o = down * 4;
                            sumR += data[o]; sumG += data[o + 1]; sumB += data[o + 2];
                            count++;
                        }
                    }

                    if (count > 0) {
                        updates.push(k, (sumR / count) | 0, (sumG / count) | 0, (sumB / count) | 0);
                    }
                }
            }
        }

        // 2. Quét vùng cực dưới
        if (hasEmptyBot) {
            for (let y = botMinY; y < OH; y++) {
                const row = y * OW;
                for (let x = 0; x < OW; x++) {
                    const k = row + x;
                    if (mask[k] === 1) continue;

                    let sumR = 0, sumG = 0, sumB = 0, count = 0;

                    const left = row + ((x - 1 + OW) % OW);
                    if (mask[left]) {
                        const o = left * 4;
                        sumR += data[o]; sumG += data[o + 1]; sumB += data[o + 2];
                        count++;
                    }
                    const right = row + ((x + 1) % OW);
                    if (mask[right]) {
                        const o = right * 4;
                        sumR += data[o]; sumG += data[o + 1]; sumB += data[o + 2];
                        count++;
                    }
                    if (y > 0) {
                        const up = (y - 1) * OW + x;
                        if (mask[up]) {
                            const o = up * 4;
                            sumR += data[o]; sumG += data[o + 1]; sumB += data[o + 2];
                            count++;
                        }
                    }
                    if (y < OH - 1) {
                        const down = (y + 1) * OW + x;
                        if (mask[down]) {
                            const o = down * 4;
                            sumR += data[o]; sumG += data[o + 1]; sumB += data[o + 2];
                            count++;
                        }
                    }

                    if (count > 0) {
                        updates.push(k, (sumR / count) | 0, (sumG / count) | 0, (sumB / count) | 0);
                    }
                }
            }
        }

        if (updates.length === 0) break;

        for (let u = 0; u < updates.length; u += 4) {
            const k = updates[u];
            mask[k] = 1;
            const o = k * 4;
            data[o] = updates[u + 1];
            data[o + 1] = updates[u + 2];
            data[o + 2] = updates[u + 3];
            data[o + 3] = 255;
        }
    }

    // Nếu sau các vòng lặp vẫn còn lỗ chóp cực, lấp êm bằng gradient chuyển sắc để đảm bảo 100% alpha = 255
    for (let k = 0; k < N; k++) {
        const o = k * 4;
        if (data[o + 3] < 10) {
            const yRatio = ((k / OW) | 0) / OH;
            data[o] = Math.round(28 + 24 * yRatio);
            data[o + 1] = Math.round(38 + 24 * yRatio);
            data[o + 2] = Math.round(58 + 24 * yRatio);
            data[o + 3] = 255;
        }
    }
}

/* ============================================================================
   3.5. BÙ NÉT BẰNG LUMINANCE EDGE-AWARE UNSHARP MASK VÀ CLARITY TRONG WORKER
   ============================================================================ */
function sampleBicubic(px, vw, vh, u, v) {
    const uClamped = Math.max(1, Math.min(vw - 3, u));
    const vClamped = Math.max(1, Math.min(vh - 3, v));
    const u0 = uClamped | 0;
    const v0 = vClamped | 0;
    const fu = uClamped - u0;
    const fv = vClamped - v0;

    const fu2 = fu * fu, fu3 = fu2 * fu;
    const wx0 = -0.5 * fu + fu2 - 0.5 * fu3;
    const wx1 = 1.0 - 2.5 * fu2 + 1.5 * fu3;
    const wx2 = 0.5 * fu + 2.0 * fu2 - 1.5 * fu3;
    const wx3 = -0.5 * fu2 + 0.5 * fu3;

    const fv2 = fv * fv, fv3 = fv2 * fv;
    const wy0 = -0.5 * fv + fv2 - 0.5 * fv3;
    const wy1 = 1.0 - 2.5 * fv2 + 1.5 * fv3;
    const wy2 = 0.5 * fv + 2.0 * fv2 - 1.5 * fv3;
    const wy3 = -0.5 * fv2 + 0.5 * fv3;

    let r = 0, g = 0, b = 0;

    let rowOff = (v0 - 1) * vw;
    let o0 = (rowOff + u0 - 1) * 4, o1 = (rowOff + u0) * 4, o2 = (rowOff + u0 + 1) * 4, o3 = (rowOff + u0 + 2) * 4;
    let rRow = wx0 * px[o0]     + wx1 * px[o1]     + wx2 * px[o2]     + wx3 * px[o3];
    let gRow = wx0 * px[o0 + 1] + wx1 * px[o1 + 1] + wx2 * px[o2 + 1] + wx3 * px[o3 + 1];
    let bRow = wx0 * px[o0 + 2] + wx1 * px[o1 + 2] + wx2 * px[o2 + 2] + wx3 * px[o3 + 2];
    r += wy0 * rRow; g += wy0 * gRow; b += wy0 * bRow;

    rowOff = v0 * vw;
    o0 = (rowOff + u0 - 1) * 4; o1 = (rowOff + u0) * 4; o2 = (rowOff + u0 + 1) * 4; o3 = (rowOff + u0 + 2) * 4;
    rRow = wx0 * px[o0]     + wx1 * px[o1]     + wx2 * px[o2]     + wx3 * px[o3];
    gRow = wx0 * px[o0 + 1] + wx1 * px[o1 + 1] + wx2 * px[o2 + 1] + wx3 * px[o3 + 1];
    bRow = wx0 * px[o0 + 2] + wx1 * px[o1 + 2] + wx2 * px[o2 + 2] + wx3 * px[o3 + 2];
    r += wy1 * rRow; g += wy1 * gRow; b += wy1 * bRow;

    rowOff = (v0 + 1) * vw;
    o0 = (rowOff + u0 - 1) * 4; o1 = (rowOff + u0) * 4; o2 = (rowOff + u0 + 1) * 4; o3 = (rowOff + u0 + 2) * 4;
    rRow = wx0 * px[o0]     + wx1 * px[o1]     + wx2 * px[o2]     + wx3 * px[o3];
    gRow = wx0 * px[o0 + 1] + wx1 * px[o1 + 1] + wx2 * px[o2 + 1] + wx3 * px[o3 + 1];
    bRow = wx0 * px[o0 + 2] + wx1 * px[o1 + 2] + wx2 * px[o2 + 2] + wx3 * px[o3 + 2];
    r += wy2 * rRow; g += wy2 * gRow; b += wy2 * bRow;

    rowOff = (v0 + 2) * vw;
    o0 = (rowOff + u0 - 1) * 4; o1 = (rowOff + u0) * 4; o2 = (rowOff + u0 + 1) * 4; o3 = (rowOff + u0 + 2) * 4;
    rRow = wx0 * px[o0]     + wx1 * px[o1]     + wx2 * px[o2]     + wx3 * px[o3];
    gRow = wx0 * px[o0 + 1] + wx1 * px[o1 + 1] + wx2 * px[o2 + 1] + wx3 * px[o3 + 1];
    bRow = wx0 * px[o0 + 2] + wx1 * px[o1 + 2] + wx2 * px[o2 + 2] + wx3 * px[o3 + 2];
    r += wy3 * rRow; g += wy3 * gRow; b += wy3 * bRow;

    return [
        r < 0 ? 0 : (r > 255 ? 255 : r),
        g < 0 ? 0 : (g > 255 ? 255 : g),
        b < 0 ? 0 : (b > 255 ? 255 : b)
    ];
}

function applyUnsharpMask(data, OW, OH, amount = 0.90, radius = 1.5, threshold = 1.2, haloLimit = 36) {
    if (amount <= 0.001) return;
    const N = OW * OH;
    const lum = new Float32Array(N);
    const tempLum = new Float32Array(N);

    for (let k = 0; k < N; k++) {
        const o = k * 4;
        lum[k] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    }

    const sigma = Math.max(0.5, radius * 0.8);
    const twoSigmaSq = 2 * sigma * sigma;
    const g0 = 1.0;
    const g1 = Math.exp(-1 / twoSigmaSq);
    const g2 = Math.exp(-4 / twoSigmaSq);
    const sum = g0 + 2 * (g1 + g2);
    const w0 = g0 / sum, w1 = g1 / sum, w2 = g2 / sum;

    for (let y = 0; y < OH; y++) {
        const row = y * OW;
        for (let x = 0; x < OW; x++) {
            const xm2 = (x - 2 + OW) % OW;
            const xm1 = (x - 1 + OW) % OW;
            const xp1 = (x + 1) % OW;
            const xp2 = (x + 2) % OW;

            tempLum[row + x] = w2 * lum[row + xm2] + w1 * lum[row + xm1] + w0 * lum[row + x] + w1 * lum[row + xp1] + w2 * lum[row + xp2];
        }
    }

    for (let y = 0; y < OH; y++) {
        const rM2 = Math.max(0, y - 2) * OW;
        const rM1 = Math.max(0, y - 1) * OW;
        const rC  = y * OW;
        const rP1 = Math.min(OH - 1, y + 1) * OW;
        const rP2 = Math.min(OH - 1, y + 2) * OW;

        for (let x = 0; x < OW; x++) {
            const k = rC + x;
            const o = k * 4;
            if (data[o + 3] === 0) continue;

            const blurY = w2 * tempLum[rM2 + x] + w1 * tempLum[rM1 + x] + w0 * tempLum[k] + w1 * tempLum[rP1 + x] + w2 * tempLum[rP2 + x];
            const origY = lum[k];
            let diff = origY - blurY;

            const absDiff = Math.abs(diff);
            if (absDiff < threshold) {
                diff = 0;
            } else if (absDiff < threshold * 2.5) {
                diff *= (absDiff - threshold) / (threshold * 1.5);
            }

            if (diff > haloLimit) diff = haloLimit;
            else if (diff < -haloLimit) diff = -haloLimit;

            const deltaY = amount * diff;
            if (Math.abs(deltaY) < 0.1) continue;

            const r = data[o] + deltaY;
            const g = data[o + 1] + deltaY;
            const b = data[o + 2] + deltaY;

            data[o]     = r < 0 ? 0 : (r > 255 ? 255 : (r + 0.5) | 0);
            data[o + 1] = g < 0 ? 0 : (g > 255 ? 255 : (g + 0.5) | 0);
            data[o + 2] = b < 0 ? 0 : (b > 255 ? 255 : (b + 0.5) | 0);
        }
    }
}

function applyClarityBoost(data, OW, OH, strength = 0.15) {
    if (strength <= 0.001) return;
    const N = OW * OH;
    for (let k = 0; k < N; k++) {
        const o = k * 4;
        if (data[o + 3] === 0) continue;

        const r = data[o], g = data[o + 1], b = data[o + 2];
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        const diff = y - 128;
        const boost = diff * strength * (1.0 - (diff * diff) / 16384);
        if (Math.abs(boost) < 0.2) continue;

        const nr = r + boost;
        const ng = g + boost;
        const nb = b + boost;

        data[o]     = nr < 0 ? 0 : (nr > 255 ? 255 : (nr + 0.5) | 0);
        data[o + 1] = ng < 0 ? 0 : (ng > 255 ? 255 : (ng + 0.5) | 0);
        data[o + 2] = nb < 0 ? 0 : (nb > 255 ? 255 : (nb + 0.5) | 0);
    }
}

/* ============================================================================
   4. TOÀN BỘ PIPELINE STITCHING ĐIỀU PHỐI TRONG WEB WORKER
   ============================================================================ */

        function executeStitching(data) {
            // Luôn khởi tạo lại frameBoxes an toàn cho từng phiên ghép
            frameBoxes = [];
            if (typeof self !== 'undefined') {
                self.frameBoxes = frameBoxes;
            }
            const { config = {}, fovDeg = 65, OW = config.panoWidth || 4096, OH = config.panoHeight || 2048, frames = [] } = data;
    const N = OW * OH;

    const postProgress = (pct, msg) => {
        self.postMessage({ type: 'progress', percent: pct, message: msg });
    };

    // Chuẩn bị mảng px cho từng frame từ ArrayBuffer
    for (let i = 0; i < frames.length; i++) {
        frames[i].px = new Uint8ClampedArray(frames[i].buffer);
    }

    // 1. Gain Compensation
    let gains = null;
    const useGain = (config.gainCompensation !== false) && frames.length >= 2;
    if (useGain) {
        postProgress(3, 'Đang cân bằng độ sáng phơi sáng ngầm (Gain Compensation)…');
        try {
            const overlapPairs = buildOverlapPairs(frames, fovDeg);
            gains = estimateExposureGains(frames, overlapPairs, fovDeg, config);
        } catch (eGain) {
            gains = frames.map(() => 1.0);
        }
    }

    // Bảng lượng giác góc cầu
    const sinL = new Float32Array(OW), cosL = new Float32Array(OW);
    for (let i = 0; i < OW; i++) {
        const l = ((i + 0.5) / OW - 0.5) * 2 * Math.PI;
        sinL[i] = Math.sin(l);
        cosL[i] = Math.cos(l);
    }
    const sinLat = new Float32Array(OH), cosLat = new Float32Array(OH);
    for (let j = 0; j < OH; j++) {
        const lat = (0.5 - (j + 0.5) / OH) * Math.PI;
        sinLat[j] = Math.sin(lat);
        cosLat[j] = Math.cos(lat);
    }

    const outBuffer = new ArrayBuffer(N * 4);
    const outData = new Uint8ClampedArray(outBuffer);

    const useMultiBand = (config.multibandBlending !== false);
    const pyramidLevels = config.pyramidLevels || 4;
    // FIX: Khai báo ngoài nhánh multiband — thông điệp 'complete' ở cuối cần mang theo metadata này.
    // Trước đây khai báo trong nhánh if khiến worker luôn rơi vào nhánh error ở bước cuối
    // dù toàn bộ pipeline đã chạy xong (ảnh đúng nhưng bị hủy).
    frameBoxes = [];

    if (useMultiBand) {
        /* Multi-band Burt-Adelson Pyramid Blending */
        const globalPyramid = [];
        for (let l = 0; l < pyramidLevels; l++) {
            const gw = OW >> l;
            const gh = OH >> l;
            globalPyramid.push({
                R: new Float32Array(gw * gh),
                G: new Float32Array(gw * gh),
                B: new Float32Array(gw * gh),
                W: new Float32Array(gw * gh)
            });
        }

        const align = 1 << (pyramidLevels - 1);

        for (let fi = 0; fi < frames.length; fi++) {
            const pct = Math.round(5 + ((fi + 1) / frames.length) * 80);
            postProgress(pct, `Đang hòa trộn đa tầng (Multi-band) ảnh ${fi + 1}/${frames.length} (${pct}%)…`);

            const { px, M, vw, vh } = frames[fi];
            const gain = (useGain && gains && gains[fi] != null) ? gains[fi] : 1.0;

            const f = (Math.max(vw, vh) * 0.5) / Math.tan(fovDeg * D2R * 0.5);
            const hw = vw * 0.5, hh = vh * 0.5;

            const fwdX = -M[0][2], fwdY = -M[1][2], fwdZ = -M[2][2];
            const centerLat = Math.asin(Math.max(-1, Math.min(1, fwdZ)));
            const centerLon = Math.atan2(fwdX, fwdY);
            const centerI = Math.round(((centerLon / (2 * Math.PI)) + 0.5) * OW);

            const maxCornerAngleRad = Math.atan(Math.hypot(hw, hh) / f);
            const bufferAngleRad = maxCornerAngleRad + 2 * D2R;

            // ĐỢT 6: LUT raised-cosine weight theo depth (1024 bucket) thay cho Math.acos tính theo pixel.
            // Với pure-rotation, depth = cos(theta) nên weight chi là hàm 1 biến của depth — build 1 lần/frame.
            const WEIGHT_LUT_SIZE = 1024;
            const weightLut = new Float32Array(WEIGHT_LUT_SIZE);
            for (let wl = 0; wl < WEIGHT_LUT_SIZE; wl++) {
                const d = wl / (WEIGHT_LUT_SIZE - 1);
                const thetaWl = Math.acos(d);
                weightLut[wl] = (thetaWl >= maxCornerAngleRad) ? 0 : 0.5 * (1.0 + Math.cos(Math.PI * thetaWl / maxCornerAngleRad));
            }

            // Xác định bounding box vĩ độ nominal (Y)
            const latMinNominal = Math.max(-Math.PI * 0.5, centerLat - bufferAngleRad);
            const latMaxNominal = Math.min(Math.PI * 0.5, centerLat + bufferAngleRad);
            const jMinNominal = Math.max(0, Math.floor((0.5 - latMaxNominal / Math.PI) * OH));
            const jMaxNominal = Math.min(OH - 1, Math.ceil((0.5 - latMinNominal / Math.PI) * OH));

            // Xác định bounding box kinh độ nominal (X)
            const cosLatAbs = Math.max(0.12, Math.cos(Math.max(Math.abs(latMinNominal), Math.abs(latMaxNominal))));
            const dLon = bufferAngleRad / cosLatAbs;

            let spanINominal;
            if (dLon >= Math.PI || Math.abs(centerLat) > 70 * D2R) {
                spanINominal = Math.floor(OW * 0.5);
            } else {
                spanINominal = Math.ceil((dLon / (2 * Math.PI)) * OW);
            }

            // Lưu thông số nominal để phục vụ debug overlay
            const nominalBoxW = Math.min(OW, 2 * spanINominal + 2);
            const nominalBoxH = jMaxNominal - jMinNominal + 1;
            const nominalBoxX = ((centerI - Math.floor(nominalBoxW / 2)) % OW + OW) % OW;
            const nominalBoxY = jMinNominal;

            // PHẦN 3.5.1: Mở rộng bounding box với biên đệm PADDING_PX (tối thiểu 48px)
            // và căn chỉnh toạ độ theo bội số của align = 1 << (pyramidLevels - 1) để triệt tiêu lệch pha sub-pixel
            const padPx = config.boxPaddingPx || 48;
            const jMin = Math.max(0, jMinNominal - padPx);
            const jMax = Math.min(OH - 1, jMaxNominal + padPx);
            const spanI = Math.min(Math.floor(OW * 0.5), spanINominal + padPx);

            const boxY = Math.max(0, Math.floor(jMin / align) * align);
            const boxH = Math.min(OH - boxY, Math.ceil((jMax - boxY + 1) / align) * align);

            const rawW = Math.min(OW, 2 * spanI + 2);
            const boxW = Math.min(OW, Math.ceil(rawW / align) * align);
            const rawBoxX = centerI - Math.floor(boxW / 2);
            const boxX = ((Math.floor(rawBoxX / align) * align % OW) + OW) % OW;

            frameBoxes.push({
                fi,
                boxX, boxY, boxW, boxH,
                nominalX: nominalBoxX, nominalY: nominalBoxY,
                nominalW: nominalBoxW, nominalH: nominalBoxH
            });

            const localR = new Float32Array(boxW * boxH);
            const localG = new Float32Array(boxW * boxH);
            const localB = new Float32Array(boxW * boxH);
            const localW = new Float32Array(boxW * boxH);

            const m00 = M[0][0], m10 = M[1][0], m20 = M[2][0];
            const m01 = M[0][1], m11 = M[1][1], m21 = M[2][1];
            const m02 = M[0][2], m12 = M[1][2], m22 = M[2][2];

            for (let ly = 0; ly < boxH; ly++) {
                const j = boxY + ly;
                if (j >= OH) break;
                const cl = cosLat[j], dz = sinLat[j];

                for (let lx = 0; lx < boxW; lx++) {
                    const i = (boxX + lx) % OW;
                    const dx = cl * sinL[i], dy = cl * cosL[i];

                    const depth = -(m02 * dx + m12 * dy + m22 * dz);
                    if (depth < 0.1) continue;

                    const sx = m00 * dx + m10 * dy + m20 * dz;
                    const sy = m01 * dx + m11 * dy + m21 * dz;

                    const u = hw + f * sx / depth;
                    const v = hh - f * sy / depth;

                    if (u < 1 || v < 1 || u >= vw - 1 || v >= vh - 1) continue;

                    // ĐỢT 6: Tra LUT theo depth thay vì gọi acos + cos cho từng pixel
                    let w = weightLut[Math.min(WEIGHT_LUT_SIZE - 1, (depth * (WEIGHT_LUT_SIZE - 1)) | 0)];
                    if (w <= 0.0001) continue;

                    // Đệm méo biên cảm biến (sensor margin) để đảm bảo không có bước nhảy đột ngột tại cạnh chữ nhật của frame
                    const edgeDist = Math.min(u, vw - 1 - u, v, vh - 1 - v);
                    if (edgeDist < 8) {
                        w *= Math.sin((Math.PI * 0.5) * Math.max(0, edgeDist) / 8);
                    }
                    if (w <= 0.0001) continue;

                    // [NÂNG CẤP ĐỢT 8]: Lấy mẫu Bicubic Catmull-Rom 16 điểm (cực nét)
                    let r, g, b;
                    if (config.useBicubicSampling !== false) {
                        const c = sampleBicubic(px, vw, vh, u, v);
                        r = c[0]; g = c[1]; b = c[2];
                    } else if (config.useBilinearSampling !== false) {
                        const u0 = Math.floor(u), v0 = Math.floor(v);
                        const u1 = Math.min(vw - 1, u0 + 1), v1 = Math.min(vh - 1, v0 + 1);
                        const fu = u - u0, fv = v - v0;
                        const o00 = (v0 * vw + u0) * 4, o10 = (v0 * vw + u1) * 4;
                        const o01 = (v1 * vw + u0) * 4, o11 = (v1 * vw + u1) * 4;
                        r = (1 - fu) * (1 - fv) * px[o00]     + fu * (1 - fv) * px[o10]     + (1 - fu) * fv * px[o01]     + fu * fv * px[o11];
                        g = (1 - fu) * (1 - fv) * px[o00 + 1] + fu * (1 - fv) * px[o10 + 1] + (1 - fu) * fv * px[o01 + 1] + fu * fv * px[o11 + 1];
                        b = (1 - fu) * (1 - fv) * px[o00 + 2] + fu * (1 - fv) * px[o10 + 2] + (1 - fu) * fv * px[o01 + 2] + fu * fv * px[o11 + 2];
                    } else {
                        const o = ((v | 0) * vw + (u | 0)) * 4;
                        r = px[o]; g = px[o + 1]; b = px[o + 2];
                    }
                    if (gain !== 1.0) {
                        r = r * gain; if (r > 255) r = 255; else if (r < 0) r = 0;
                        g = g * gain; if (g > 255) g = 255; else if (g < 0) g = 0;
                        b = b * gain; if (b > 255) b = 255; else if (b < 0) b = 0;
                    }

                    const lIdx = ly * boxW + lx;
                    localR[lIdx] = r;
                    localG[lIdx] = g;
                    localB[lIdx] = b;
                    localW[lIdx] = w;
                }
            }

            const localLapR = buildLaplacianPyramid(localR, boxW, boxH, pyramidLevels);
            const localLapG = buildLaplacianPyramid(localG, boxW, boxH, pyramidLevels);
            const localLapB = buildLaplacianPyramid(localB, boxW, boxH, pyramidLevels);
            const localGaussW = buildGaussianPyramid(localW, boxW, boxH, pyramidLevels);

            accumulateIntoGlobalBuffer(
                globalPyramid,
                localLapR, localLapG, localLapB, localGaussW,
                boxX, boxY, boxW, boxH,
                OW, OH, pyramidLevels
            );
        }

        postProgress(88, 'Đang chuẩn hóa và tổng hợp đa tầng (Collapsing pyramid)…');

        for (let l = 0; l < pyramidLevels; l++) {
            const gw = OW >> l;
            const gh = OH >> l;
            const totalPixels = gw * gh;
            const gR = globalPyramid[l].R;
            const gG = globalPyramid[l].G;
            const gB = globalPyramid[l].B;
            const gW = globalPyramid[l].W;

            for (let k = 0; k < totalPixels; k++) {
                const w = gW[k];
                if (w > 1e-6) {
                    const invW = 1.0 / w;
                    gR[k] *= invW;
                    gG[k] *= invW;
                    gB[k] *= invW;
                } else {
                    gR[k] = 0;
                    gG[k] = 0;
                    gB[k] = 0;
                }
            }
        }

        const collapsed = collapsePyramid(globalPyramid, OW, OH, pyramidLevels);

        postProgress(94, 'Đang ghi pixel ảnh toàn cảnh…');

        for (let k = 0; k < N; k++) {
            const w = collapsed.W[k];
            const o = k * 4;
            if (w > 1e-4) {
                outData[o] = Math.max(0, Math.min(255, Math.round(collapsed.R[k])));
                outData[o + 1] = Math.max(0, Math.min(255, Math.round(collapsed.G[k])));
                outData[o + 2] = Math.max(0, Math.min(255, Math.round(collapsed.B[k])));
                outData[o + 3] = 255;
            } else {
                if (config.diffusionPoleFill !== false) {
                    outData[o + 3] = 0; // Để alpha = 0 cho thuật toán khuếch tán nhận diện
                } else {
                    const yRatio = ((k / OW) | 0) / OH;
                    outData[o] = Math.round(28 + 24 * yRatio);
                    outData[o + 1] = Math.round(38 + 24 * yRatio);
                    outData[o + 2] = Math.round(58 + 24 * yRatio);
                    outData[o + 3] = 255;
                }
            }
        }
    } else {
        /* Legacy feathering fallback */
        const AR = new Float32Array(N), AG = new Float32Array(N), AB = new Float32Array(N), AW = new Float32Array(N);
        const halfFovRad = (fovDeg * 0.5 + 10) * D2R;

        for (let fi = 0; fi < frames.length; fi++) {
            const pct = Math.round((fi / frames.length) * 85);
            postProgress(pct, `Đang hòa trộn ảnh ${fi + 1}/${frames.length} (${pct}%)…`);

            const { px, M, vw, vh } = frames[fi];
            const gain = (useGain && gains && gains[fi] != null) ? gains[fi] : 1.0;

            const f = (Math.max(vw, vh) * 0.5) / Math.tan(fovDeg * D2R * 0.5);
            const hw = vw * 0.5, hh = vh * 0.5;

            const fwdX = -M[0][2], fwdY = -M[1][2], fwdZ = -M[2][2];
            const centerLat = Math.asin(Math.max(-1, Math.min(1, fwdZ)));

            const latMin = Math.max(-Math.PI * 0.5, centerLat - halfFovRad);
            const latMax = Math.min(Math.PI * 0.5, centerLat + halfFovRad);
            const jMin = Math.max(0, Math.floor((0.5 - latMax / Math.PI) * OH));
            const jMax = Math.min(OH - 1, Math.ceil((0.5 - latMin / Math.PI) * OH));

            const m00 = M[0][0], m10 = M[1][0], m20 = M[2][0];
            const m01 = M[0][1], m11 = M[1][1], m21 = M[2][1];
            const m02 = M[0][2], m12 = M[1][2], m22 = M[2][2];

            for (let j = jMin; j <= jMax; j++) {
                const cl = cosLat[j], dz = sinLat[j];
                for (let i = 0; i < OW; i++) {
                    const dx = cl * sinL[i], dy = cl * cosL[i];
                    const depth = -(m02 * dx + m12 * dy + m22 * dz);
                    if (depth < 0.1) continue;

                    const sx = m00 * dx + m10 * dy + m20 * dz;
                    const sy = m01 * dx + m11 * dy + m21 * dz;

                    const u = hw + f * sx / depth;
                    const v = hh - f * sy / depth;

                    if (u < 1 || v < 1 || u >= vw - 1 || v >= vh - 1) continue;

                    const ax = Math.abs(u - hw) / hw;
                    const ay = Math.abs(v - hh) / hh;
                    let w = (1 - ax) * (1 - ay);
                    w = w * w;
                    if (w <= 0) continue;

                    const o = ((v | 0) * vw + (u | 0)) * 4;
                    const k = j * OW + i;

                    let r = px[o], g = px[o + 1], b = px[o + 2];
                    if (gain !== 1.0) {
                        r = px[o] * gain; if (r > 255) r = 255; else if (r < 0) r = 0;
                        g = px[o + 1] * gain; if (g > 255) g = 255; else if (g < 0) g = 0;
                        b = px[o + 2] * gain; if (b > 255) b = 255; else if (b < 0) b = 0;
                    }

                    AR[k] += r * w;
                    AG[k] += g * w;
                    AB[k] += b * w;
                    AW[k] += w;
                }
            }
        }

        for (let k = 0; k < N; k++) {
            const w = AW[k];
            const o = k * 4;
            if (w > 0) {
                outData[o] = Math.min(255, Math.round(AR[k] / w));
                outData[o + 1] = Math.min(255, Math.round(AG[k] / w));
                outData[o + 2] = Math.min(255, Math.round(AB[k] / w));
                outData[o + 3] = 255;
            } else {
                if (config.diffusionPoleFill !== false) {
                    outData[o + 3] = 0;
                } else {
                    const yRatio = ((k / OW) | 0) / OH;
                    outData[o] = Math.round(28 + 24 * yRatio);
                    outData[o + 1] = Math.round(38 + 24 * yRatio);
                    outData[o + 2] = Math.round(58 + 24 * yRatio);
                    outData[o + 3] = 255;
                }
            }
        }
    }

    // 4. Lấp cực khuếch tán biên (Diffusion Pole Fill)
    if (config.diffusionPoleFill !== false) {
        postProgress(97, 'Đang khuếch tán tự nhiên lấp vùng trần & sàn (Pole fill)…');
        applyDiffusionPoleFill(outData, OW, OH, config.poleFillIterations || 60);
    }

    // 5. ĐỢT 3.5.2 & 8: Bù nét Luminance Edge-Aware Unsharp Mask + Clarity Boost
    if (config.postSharpen !== false) {
        postProgress(98, 'Đang phục hồi độ sắc nét & tương phản vi mô (HD Clarity)…');
        applyUnsharpMask(outData, OW, OH, config.unsharpAmount || 0.90, config.unsharpRadius || 1.5, config.unsharpThreshold || 1.2, config.unsharpHaloLimit || 36);
        applyClarityBoost(outData, OW, OH, config.clarityStrength || 0.15);
    }

    postProgress(100, 'Hoàn tất ghép ảnh 360°!');

    // Gửi kết quả dạng Transferable Object (ArrayBuffer) và metadata frameBoxes về luồng chính
    self.postMessage({
        type: 'complete',
        buffer: outBuffer,
        OW: OW,
        OH: OH,
        frameBoxes: (typeof frameBoxes !== 'undefined' && Array.isArray(frameBoxes)) ? frameBoxes : []
    }, [outBuffer]);
}

/* ============================================================================
   5. XỬ LÝ SỰ KIỆN POSTMESSAGE TRONG WEB WORKER
   ============================================================================ */

self.onmessage = function (e) {
    const data = e.data;
    if (!data) return;

    if (data.type === 'START_STITCHING') {
        try {
            executeStitching(data);
        } catch (err) {
            self.postMessage({
                type: 'error',
                error: (err && err.message) ? err.message : String(err)
            });
        }
    }
};
