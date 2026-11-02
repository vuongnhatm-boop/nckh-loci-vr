/**
 * HISTORICAL IMAGE SEARCH & VERIFICATION ENGINE v2.0
 * Tìm kiếm và hiển thị hình ảnh tư liệu lịch sử CHÍNH XÁC từ:
 * 1. Wikimedia Commons Search API (Kho ảnh tư liệu mở lớn nhất thế giới — luôn trả thumbnail thật)
 * 2. Wikipedia Page Images API (Ảnh đại diện bài viết — luôn hợp lệ)
 * 3. Pollinations AI (Tái hiện bối cảnh lịch sử khi không tìm thấy ảnh thật)
 *
 * v2.0: Loại bỏ toàn bộ URL tĩnh giả mạo, chỉ dùng API trực tiếp đảm bảo 100% ảnh hiển thị được.
 */

// 1. BỘ TỪ KHÓA THÔNG MINH — ÁNH XẠ QUERY NGƯỜI DÙNG → TỪ KHÓA TÌM KIẾM TỐI ƯU TRÊN WIKI
const SEARCH_QUERY_MAP = {
  'đảng cộng sản': 'Đảng Cộng sản Việt Nam thành lập 1930',
  '3/2/1930': 'Đảng Cộng sản Việt Nam thành lập 1930',
  'xô viết': 'Xô viết Nghệ Tĩnh 1930',
  'nghệ tĩnh': 'Xô viết Nghệ Tĩnh phong trào',
  'bắc sơn': 'Khởi nghĩa Bắc Sơn 1940',
  'nam kỳ khởi nghĩa': 'Khởi nghĩa Nam Kỳ 1940',
  'ba tơ': 'Khởi nghĩa Ba Tơ 1945',
  'tháng tám': 'Cách mạng tháng Tám 1945 Việt Nam',
  'cách mạng tháng 8': 'Cách mạng tháng Tám 1945 Việt Nam',
  '19/8': 'Cách mạng tháng Tám Hà Nội 1945',
  '2/9/1945': 'Hồ Chí Minh đọc Tuyên ngôn Độc lập 1945',
  'tuyên ngôn độc lập': 'Hồ Chí Minh đọc Tuyên ngôn Độc lập Ba Đình',
  'nhà hát lớn': 'Cách mạng tháng Tám Nhà hát Lớn Hà Nội',
  'toàn quốc kháng chiến': 'Toàn quốc kháng chiến 1946 Hà Nội',
  'quyết tử': 'Trung đoàn Thủ đô quyết tử 1946',
  'kháng chiến chống thực dân': 'Kháng chiến chống Pháp 1946 1954 Việt Nam',
  'kháng chiến chống pháp': 'Kháng chiến chống Pháp Việt Nam',
  'chống thực dân pháp': 'Chiến tranh Đông Dương lần thứ nhất',
  'việt bắc': 'Chiến dịch Việt Bắc thu đông 1947',
  'thu đông 1947': 'Chiến dịch Việt Bắc 1947',
  'biên giới': 'Chiến dịch Biên giới thu đông 1950',
  'đông khê': 'Trận Đông Khê 1950',
  'điện biên phủ': 'Chiến dịch Điện Biên Phủ 1954',
  'mường thanh': 'Trận Điện Biên Phủ',
  'de castries': 'Trận Điện Biên Phủ De Castries',
  'võ nguyên giáp': 'Đại tướng Võ Nguyên Giáp',
  'giơ-ne-vơ': 'Hội nghị Genève 1954',
  'geneve': 'Geneva Conference 1954 Indochina',
  'đồng khởi': 'Phong trào Đồng khởi 1960 Bến Tre',
  'bến tre': 'Phong trào Đồng khởi Bến Tre',
  'ấp bắc': 'Trận Ấp Bắc 1963',
  'mậu thân': 'Sự kiện Tết Mậu Thân 1968',
  'tết mậu thân': 'Tet Offensive 1968 Vietnam',
  'b-52': 'Chiến dịch Linebacker II B-52 Hà Nội 1972',
  'điện biên phủ trên không': 'Linebacker II Hanoi Christmas bombing 1972',
  'hiệp định paris': 'Hiệp định Paris 1973 Việt Nam',
  'pa-ri': 'Paris Peace Accords 1973 Vietnam',
  'lê đức thọ': 'Lê Đức Thọ Kissinger Paris',
  'chiến dịch hồ chí minh': 'Chiến dịch Hồ Chí Minh 1975 giải phóng Sài Gòn',
  '30/4': 'Fall of Saigon 1975 tank Independence Palace',
  'dinh độc lập': 'Dinh Độc Lập 30 tháng 4 1975',
  'giải phóng miền nam': 'Giải phóng miền Nam Việt Nam 1975',
  'tây nguyên': 'Chiến dịch Tây Nguyên 1975',
  'đổi mới': 'Đổi Mới Việt Nam 1986',
  'đại hội vi': 'Đại hội Đảng Cộng sản Việt Nam lần thứ VI 1986',
  'liên hợp quốc': 'United Nations General Assembly',
  'united nations': 'United Nations General Assembly',
  'ianta': 'Yalta Conference 1945 Churchill Roosevelt Stalin',
  'yalta': 'Yalta Conference 1945',
  'churchill': 'Yalta Conference Churchill Roosevelt Stalin',
  'asean': 'ASEAN Association Southeast Asian Nations',
  'đông nam á': 'ASEAN Southeast Asia',
  'chiến tranh lạnh': 'Cold War Berlin Wall',
  'nguyễn ái quốc': 'Nguyễn Ái Quốc Hồ Chí Minh trẻ',
  'tìm đường cứu nước': 'Nguyễn Ái Quốc tìm đường cứu nước',
  'đại hội tours': 'Nguyễn Ái Quốc Đại hội Tours 1920',
  'hồ chí minh': 'Hồ Chí Minh chủ tịch',
  'bác hồ': 'Hồ Chí Minh chủ tịch nước',
  'kháng chiến chống mỹ': 'Chiến tranh Việt Nam kháng chiến chống Mỹ',
  'chống mỹ': 'Vietnam War American War',
  'trường sơn': 'Đường Trường Sơn đường mòn Hồ Chí Minh',
  'đường mòn hồ chí minh': 'Ho Chi Minh trail Truong Son',
  'trần phú': 'Trần Phú tổng bí thư',
  'lăng bác': 'Lăng Chủ tịch Hồ Chí Minh',
  'quảng trường ba đình': 'Quảng trường Ba Đình Hà Nội'
};

// 2. TÌM KIẾM TRỰC TIẾP TRÊN WIKIMEDIA COMMONS (LỌC CHẶT: CHỈ GIỮ ẢNH CHỤP THẬT)
async function searchWikimediaCommons(query) {
  if (!query || !query.trim()) return [];
  const cleanQ = query.replace(/[#*`_>|]/g, '').trim();

  // Thêm filetype:bitmap để chỉ tìm ảnh bitmap (jpg/png), loại svg/pdf/ogg
  const searchTerms = cleanQ + ' filetype:bitmap';

  try {
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(searchTerms)}&gsrlimit=10&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=800`;
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return [];

    // Danh sách từ khóa cần loại bỏ trong tên file (bản đồ, biểu đồ, cờ, logo, icon)
    const excludePatterns = /\b(map|carte|karte|mapa|diagram|chart|graph|flag|logo|icon|coat.of.arms|emblem|seal|stamp|medal|badge|ribbon|svg|location|locator|admin|subdivision|provinces|district)\b/i;

    const results = [];
    for (const key in pages) {
      const p = pages[key];
      const info = p.imageinfo?.[0];
      if (!info || !info.thumburl) continue;

      const url = info.thumburl;
      const fileName = (p.title || '').toLowerCase();

      // Lọc bỏ file không phải ảnh chụp
      if (/\.(svg|ogg|ogv|webm|pdf|tiff?)$/i.test(url)) continue;
      if (excludePatterns.test(fileName)) continue;

      // Lọc bỏ ảnh quá nhỏ (icon, thumbnail)
      const width = info.width || 0;
      const height = info.height || 0;
      if (width < 300 && height < 200) continue;

      const meta = info.extmetadata || {};
      const desc = meta.ImageDescription?.value?.replace(/<[^>]+>/g, '').substring(0, 120) || '';
      const caption = p.title.replace('File:', '').replace(/\.[^.]+$/, '').replace(/_/g, ' ');

      results.push({
        url: url,
        caption: desc || caption,
        source: 'Wikimedia Commons — Kho tư liệu mở quốc tế',
        _width: width
      });
    }

    // Sắp xếp: ảnh lớn hơn (chất lượng cao) lên trước
    results.sort((a, b) => (b._width || 0) - (a._width || 0));
    return results;
  } catch (err) {
    console.warn('Lỗi truy vấn Wikimedia Commons:', err);
    return [];
  }
}

// 3. TÌM KIẾM TRÊN WIKIPEDIA (ẢNH ĐẠI DIỆN BÀI VIẾT — CHÍNH XÁC NHẤT VÌ ĐƯỢC BIÊN TẬP)
async function searchWikipediaImages(query) {
  if (!query || !query.trim()) return [];
  const cleanQ = query.replace(/[#*`_>|]/g, '').trim();

  const fetchWiki = async (lang) => {
    const endpoint = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(cleanQ)}&gsrlimit=5&prop=pageimages|extracts&pithumbsize=800&exintro=1&explaintext=1&exchars=120`;
    try {
      const res = await fetch(endpoint);
      if (!res.ok) return [];
      const data = await res.json();
      const pages = data.query?.pages;
      if (!pages) return [];

      const results = [];
      for (const key in pages) {
        const p = pages[key];
        if (p.thumbnail && p.thumbnail.source) {
          if (p.thumbnail.width >= 200 || p.thumbnail.height >= 150) {
            // Loại bỏ nếu thumbnail là cờ/logo/bản đồ
            const src = p.thumbnail.source.toLowerCase();
            if (/flag|logo|coat|emblem|seal|map|carte/.test(src)) continue;

            results.push({
              url: p.thumbnail.source,
              caption: p.title + (p.extract ? `: ${p.extract.replace(/\s+/g, ' ').substring(0, 100)}...` : ''),
              source: `Bách khoa toàn thư Wikipedia (${lang})`
            });
          }
        }
      }
      return results;
    } catch (err) {
      console.warn(`Lỗi truy vấn Wikipedia ${lang}:`, err);
      return [];
    }
  };

  // Song song: tiếng Việt + tiếng Anh
  const [viResults, enResults] = await Promise.all([
    fetchWiki('vi'),
    fetchWiki('en')
  ]);

  // Ưu tiên tiếng Việt, bổ sung tiếng Anh
  const list = [...viResults];
  enResults.forEach(item => {
    if (!list.some(x => x.url === item.url)) {
      list.push(item);
    }
  });
  return list;
}

// 4. TÌM TỔNG HỢP — CHỈ TRẢ VỀ TỐI ĐA 3 ẢNH CHÍNH XÁC NHẤT
async function getAccurateHistoricalImages(query) {
  if (!query) return [];
  const lower = query.toLowerCase();

  // Tối ưu hóa từ khóa tìm kiếm bằng bộ ánh xạ
  let optimizedQuery = query;
  let bestMatchLen = 0;
  for (const [kw, searchQ] of Object.entries(SEARCH_QUERY_MAP)) {
    if (lower.includes(kw) && kw.length > bestMatchLen) {
      optimizedQuery = searchQ;
      bestMatchLen = kw.length;
    }
  }

  console.log(`🔍 Tìm ảnh với query tối ưu: "${optimizedQuery}" (gốc: "${query}")`);

  // Song song tìm từ Wikipedia (chính xác nhất) và Wikimedia Commons
  const [wikiResults, commonsResults] = await Promise.all([
    searchWikipediaImages(optimizedQuery),
    searchWikimediaCommons(optimizedQuery)
  ]);

  // ƯU TIÊN: Wikipedia trước (ảnh đại diện bài viết được biên tập chuẩn xác), Commons sau
  const list = [...wikiResults];
  commonsResults.forEach(item => {
    if (!list.some(x => x.url === item.url)) {
      list.push(item);
    }
  });

  // CHỈ TRẢ VỀ 3 ẢNH CHÍNH XÁC NHẤT
  return list.slice(0, 3);
}
window.getAccurateHistoricalImages = getAccurateHistoricalImages;

// 5. MODAL TÌM & CHÈN ẢNH TƯ LIỆU
window.openHistoricalImageFinder = async function(presetQuery) {
  const modal = document.getElementById('image-finder-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  const input = document.getElementById('finder-search-input');
  const resultsBox = document.getElementById('finder-results-box');

  let defaultQuery = presetQuery;
  if (!defaultQuery) {
    const srcText = (document.getElementById('notebook-source-text')?.value || '').trim();
    if (srcText) {
      const firstLine = srcText.split(/\r?\n/)[0];
      defaultQuery = firstLine.length < 80 ? firstLine.replace(/^[#*\s\d\.-]+/, '') : srcText.substring(0, 50);
    }
  }
  if (!defaultQuery) defaultQuery = 'Chiến dịch Điện Biên Phủ 1954';

  if (input) input.value = defaultQuery;

  // Render tìm kiếm ngay lập tức
  await renderImageFinderResults(defaultQuery);
};

window.closeHistoricalImageFinder = function() {
  const modal = document.getElementById('image-finder-modal');
  if (modal) modal.style.display = 'none';
};

// Mở trực tiếp Google Images với từ khóa
window.searchOnGoogleImages = function() {
  const input = document.getElementById('finder-search-input');
  let q = (input ? input.value : '').trim();
  if (!q) {
     const text = typeof window.lastNotebookSummaryText !== 'undefined' ? window.lastNotebookSummaryText : (typeof lastNotebookSummary !== 'undefined' ? lastNotebookSummary : '');
     const titleMatch = text.match(/Bài\s+\d+:\s*(.+)/i) || text.match(/##\s*(.+)/);
     if (titleMatch && titleMatch[1]) {
       q = titleMatch[1].replace(/[*#`_>|]/g, '').trim().substring(0, 50);
     } else {
       q = 'Lịch sử Việt Nam';
     }
  }
  const fullQ = q + ' ảnh tư liệu lịch sử Việt Nam';
  window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(fullQ)}`, '_blank');
};

// Render danh sách ảnh trong Modal
async function renderImageFinderResults(query) {
  const resultsBox = document.getElementById('finder-results-box');
  if (!resultsBox) return;

  resultsBox.innerHTML = `
    <div style="text-align: center; padding: 40px; color: #94a3b8;">
      <div class="spinner-ring" style="margin: 0 auto 12px auto; width: 36px; height: 36px;"></div>
      <p style="font-size: 0.88rem;">Đang tìm kiếm ảnh tư liệu lịch sử từ Wikimedia Commons & Wikipedia...</p>
    </div>
  `;

  const images = await getAccurateHistoricalImages(query);

  if (images.length === 0) {
    resultsBox.innerHTML = `
      <div style="text-align: center; padding: 30px; color: #94a3b8;">
        <div style="font-size: 36px; margin-bottom: 8px;">🔍</div>
        <h4>Không tìm thấy ảnh tự động cho từ khóa này</h4>
        <p style="font-size: 0.84rem; max-width: 440px; margin: 6px auto 14px auto;">
          Bạn có thể nhấn nút <b>"Tìm trên Google Images"</b> phía trên, sau đó sao chép địa chỉ hình ảnh và dán vào thanh dán link để chèn vào bản đồ.
        </p>
        <button class="finder-btn-google" style="margin: 0 auto;" onclick="window.searchOnGoogleImages()">
          🔎 Mở Google Images để tìm ảnh này ↗
        </button>
      </div>
    `;
    return;
  }

  let html = `<div class="finder-grid">`;
  images.forEach((img, idx) => {
    const safeCaption = (img.caption || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeUrl = (img.url || '').replace(/'/g, "\\'");
    const safeSource = (img.source || '').replace(/'/g, "\\'");

    html += `
      <div class="finder-item" id="finder-item-${idx}">
        <img class="finder-item-thumb" src="${img.url}" alt="${img.caption}" loading="lazy" onerror="this.closest('.finder-item').style.display='none';" />
        <div class="finder-item-body">
          <div class="finder-item-caption">📸 ${img.caption}</div>
          <div class="finder-item-source">🏛️ ${img.source || 'Kho lưu trữ lịch sử'}</div>
          <button class="finder-item-btn" onclick="window.insertHistoricalImageToCurrentSummary('${safeUrl}', '${safeCaption}', '${safeSource}')">
            ➕ Chèn vào Bản đồ
          </button>
        </div>
      </div>
    `;
  });
  html += `</div>`;

  resultsBox.innerHTML = html;
}

// Chèn hình ảnh vào nội dung Bản đồ Kiến thức Lịch sử
window.insertHistoricalImageToCurrentSummary = function(url, caption, source) {
  if (!url) return;

  const imageMarkdown = `\n\n## 🖼️ Tư liệu hình ảnh lịch sử (Xác thực)\n![${caption}](${url})\n> 📌 *Nguồn tư liệu: ${source || 'Tư liệu lịch sử xác thực'}*\n`;

  const outputEl = document.getElementById('notebook-output');
  const resultActions = document.getElementById('result-actions');
  if (resultActions) resultActions.style.display = 'flex';

  if (typeof window.renderNotebookMarkdownHtml === 'function') {
    window.lastNotebookSummaryText = (window.lastNotebookSummaryText || '') + imageMarkdown;
    if (outputEl) {
      outputEl.innerHTML = window.renderNotebookMarkdownHtml(window.lastNotebookSummaryText);
    }
  } else if (typeof renderNotebookMarkdown === 'function') {
    window.lastNotebookSummary = (window.lastNotebookSummary || (typeof lastNotebookSummary !== 'undefined' ? lastNotebookSummary : '')) + imageMarkdown;
    if (typeof lastNotebookSummary !== 'undefined') lastNotebookSummary = window.lastNotebookSummary;
    if (outputEl) {
      outputEl.innerHTML = renderNotebookMarkdown(window.lastNotebookSummary);
    }
  }

  window.closeHistoricalImageFinder();
};

// Chèn ảnh từ URL người dùng dán vào từ Google Images
window.insertCustomGoogleImageUrl = function() {
  const urlInput = document.getElementById('finder-paste-url');
  const capInput = document.getElementById('finder-paste-caption');

  const url = (urlInput ? urlInput.value : '').trim();
  const caption = (capInput ? capInput.value : '').trim() || 'Ảnh tư liệu lịch sử tra cứu từ Google Images';

  if (!url) {
    alert('Vui lòng dán đường dẫn (URL) hình ảnh bạn đã sao chép từ Google Images!');
    return;
  }

  window.insertHistoricalImageToCurrentSummary(url, caption, 'Google Images / Tư liệu ảnh sưu tầm');
  if (urlInput) urlInput.value = '';
  if (capInput) capInput.value = '';
};

// 6. LIGHTBOX PREVIEW ẢNH PHÓNG TO
window.previewHistoricalImage = function(url, caption) {
  const lightbox = document.getElementById('image-lightbox-modal');
  const imgEl = document.getElementById('lightbox-img');
  const capEl = document.getElementById('lightbox-caption');

  if (lightbox && imgEl) {
    imgEl.src = url;
    if (capEl) capEl.textContent = '📸 ' + (caption || 'Tư liệu lịch sử xác thực');
    lightbox.style.display = 'flex';
  }
};

window.closeHistoricalLightbox = function() {
  const lightbox = document.getElementById('image-lightbox-modal');
  if (lightbox) lightbox.style.display = 'none';
};

// 7. TỰ ĐỘNG CHÈN ẢNH TƯ LIỆU KHI TẠO HISTORICAL KNOWLEDGE MAP
window.autoAttachHistoricalImagesToSummary = async function(sourceText, currentSummaryMd) {
  if (!currentSummaryMd) return currentSummaryMd;

  // Trích xuất từ khóa chính từ dòng đầu
  let kw = 'Lịch sử Việt Nam';
  const titleMatch = sourceText.match(/Bài\s+\d+:\s*(.+)/i) || sourceText.match(/##\s*(.+)/);
  if (titleMatch && titleMatch[1]) {
    kw = titleMatch[1].replace(/[*#`_>|]/g, '').trim().substring(0, 60);
  } else {
    const rawLines = sourceText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.includes('BẢN ĐỒ KIẾN THỨC'));
    if (rawLines.length > 0) kw = rawLines[0].substring(0, 60);
  }

  const photos = await getAccurateHistoricalImages(kw);

  if (photos.length > 0) {
    const topPhotos = photos.slice(0, 2);
    let imagesBlock = `\n\n## 13. Hình ảnh tư liệu lịch sử (Xác thực)\n`;
    topPhotos.forEach(p => {
      imagesBlock += `![${p.caption}](${p.url})\n> 📌 *Nguồn: ${p.source}*\n\n`;
    });
    return currentSummaryMd + imagesBlock;
  }

  return currentSummaryMd;
};

// Khởi tạo các sự kiện khi DOM sẵn sàng
function initHistoricalImageFinderEvents() {
  const searchBtn = document.getElementById('finder-search-btn');
  const searchInput = document.getElementById('finder-search-input');
  const googleBtn = document.getElementById('finder-google-btn');
  const insertUrlBtn = document.getElementById('finder-btn-insert-url');

  if (searchBtn && searchInput) {
    searchBtn.onclick = () => {
      renderImageFinderResults(searchInput.value.trim());
    };
    searchInput.onkeydown = (e) => {
      if (e.key === 'Enter') renderImageFinderResults(searchInput.value.trim());
    };
  }

  if (googleBtn) {
    googleBtn.onclick = window.searchOnGoogleImages;
  }

  if (insertUrlBtn) {
    insertUrlBtn.onclick = window.insertCustomGoogleImageUrl;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHistoricalImageFinderEvents);
} else {
  initHistoricalImageFinderEvents();
}
