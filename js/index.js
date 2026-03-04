import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// لێرەدا URL و Key ی پڕۆژەکەی خۆت دابنێ
const supabaseUrl = 'https://lijeymdwahgbodzkpnqq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpamV5bWR3YWhnYm9kemtwbnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjMyOTYsImV4cCI6MjA4ODEzOTI5Nn0.dEAbEl5Ld7ETCxgxxSiYFuNQ4ZyuV0wO0dbGfdZzro8';
const supabase = createClient(supabaseUrl, supabaseKey);

// ڕێکخستنی کتێبخانەی PDF.js
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// فەنکشنی دروستکردنی وێنەی کاغەز (Thumbnail) بە کوالێتی بەرز
async function renderPdfThumbnail(url, container) {
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); // تەنها لاپەڕەی یەکەم دەهێنێت
        
        const viewport = page.getViewport({ scale: 1.5 }); // کوالێتی وێنەکە
        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-canvas';
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // کێشانی PDFـەکە لەسەر Canvas
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        container.innerHTML = ''; // لابردنی نیشانەی لۆدینگە سوڕاوەکە
        container.appendChild(canvas);
    } catch (error) {
        console.error('هەڵە لە وێنەی پێشەکی:', error);
        container.innerHTML = '<span style="color:gray; font-size:14px;">پێشاندان بەردەست نییە</span>';
    }
}

// فەنکشنی چاپکردنی ڕاستەوخۆ (Direct Print)
// فەنکشنی چاپکردنی ڕاستەوخۆ (Direct Print)
async function directPrint(url, btnElement) {
    const originalText = btnElement.innerHTML;
    try {
        // گۆڕینی دوگمەکە بۆ کاتی ئامادەکردن
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="spinner-small" style="width:18px; height:18px; border-width:2px;"></div> ئامادەکردن...';

        // پشکنین بۆ ئەوەی بزانین بەکارهێنەر مۆبایل بەکاردەهێنێت یان کۆمپیوتەر
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            // ئەگەر مۆبایل بوو، ڕاستەوخۆ فایلەکە دەکەینەوە. 
            // ئەمە باشترین ڕێگەیە بۆ ئەوەی هەموو لاپەڕەکان بەبێ تێکستی زیادە چاپ ببن لە مۆبایلدا.
            window.open(url, '_blank');
            
            btnElement.disabled = false;
            btnElement.innerHTML = originalText;
            return; // لێرەدا دەوەستێت و ناچێتە خوارەوە
        }

        // ئەگەر کۆمپیوتەر بوو، هەمان سیستەمی خێرا (iframe) بەکاردەهێنین
        const response = await fetch(url);
        const data = await response.blob();
        
        // دڵنیابوون لەوەی فایلەکە وەک PDFـی خاو دەناسرێنرێت بۆ ڕێگریکردن لە نووسینی زیادە
        const blob = new Blob([data], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        
        const printFrame = document.getElementById('print-iframe');
        printFrame.src = blobUrl;
        
        // کاتێک فایلەکە چووە ناو iframeـە شاراوەکە، فەرمانی پرینت بدە
        printFrame.onload = () => {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
            
            // گەڕاندنەوەی دوگمەکە بۆ دۆخی ئاسایی
            btnElement.disabled = false;
            btnElement.innerHTML = originalText;
            
            // پاککردنەوەی میمۆری
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        };
    } catch (error) {
        console.error('هەڵە لە چاپکردن:', error);
        alert("کێشەیەک هەیە لە پەیوەندی بە پرینتەرەوە، تکایە ڕاستەوخۆ فایلەکە بکەرەوە و چاپی بکە.");
        btnElement.disabled = false;
        btnElement.innerHTML = originalText;
        window.open(url, '_blank'); // ئەگەر کێشە هەبوو، لە پەنجەرەی نوێ دەیکاتەوە
    }
}

// کۆنتڕۆڵکردنی پەنجەرەی Modal بۆ کردنەوە
const modal = document.getElementById('pdf-modal');
const modalIframe = document.getElementById('modal-iframe');
const modalTitle = document.getElementById('modal-title');
const closeModalBtn = document.getElementById('close-modal');

function openModal(url, title) {
    modalTitle.innerText = title;
    // بەکارهێنانی لینکەکە ڕاستەوخۆ (لابردنی تووڵبارەکانی خوارەوە بۆ جوانی)
    modalIframe.src = url + "#toolbar=0&navpanes=0&scrollbar=0";
    modal.style.display = 'flex';
}

closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    modalIframe.src = ''; // وەستاندنی فایلەکە بۆ کەمکردنەوەی لۆد
});

// هێنانی داتاکان لە داتابەیس
async function loadPDFs() {
    const gridDiv = document.getElementById("pdf-grid");
    
    try {
const { data: pdfs, error } = await supabase
            .from('pdfs')
            .select('*')
            // ئەم دوو دێڕە گرنگن بۆ ڕیزبەندییەکە
            .order('sort_order', { ascending: true }) 
            .order('created_at', { ascending: false });
        if (error) throw error;
        gridDiv.innerHTML = ""; 

        if(!pdfs || pdfs.length === 0) {
            gridDiv.innerHTML = `<p style="text-align:center; width:100%; color:gray;">هیچ فایلێک نییە.</p>`;
            return;
        }

        let delay = 0;

        pdfs.forEach((doc) => {
            // دروستکردنی کارتی فایلەکە بە شێوازی داینامیک
            const card = document.createElement('div');
            card.className = 'pdf-card';
            card.style.animationDelay = `${delay}s`;

            // سەرنج بدە لێرەدا ڕیزبەندییەکەم گۆڕیوە (ناونیشان لە سەرەتایە)
            card.innerHTML = `
                <div class="pdf-title" title="${doc.name}">${doc.name}</div>
                <div class="paper-preview-wrapper">
                    <div class="spinner-small"></div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-print">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        چاپکردن
                    </button>
                    <button class="btn btn-open">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        کردنەوە
                    </button>
                </div>
            `;
            gridDiv.appendChild(card);

            // کارپێکردنی دوگمەکان
            const printBtn = card.querySelector('.btn-print');
            printBtn.addEventListener('click', () => directPrint(doc.file_url, printBtn));

            const openBtn = card.querySelector('.btn-open');
            openBtn.addEventListener('click', () => openModal(doc.file_url, doc.name));

            // دروستکردنی وێنەی کاغەزەکە بە بەکارهێنانی PDF.js
            const canvasContainer = card.querySelector('.paper-preview-wrapper');
            renderPdfThumbnail(doc.file_url, canvasContainer);

            delay += 0.1;
        });

    } catch (error) {
        console.error("هەڵە:", error);
        gridDiv.innerHTML = `<p style="color:red; text-align:center;">هەڵەیەک هەیە لە هێنانی زانیارییەکان.</p>`;
    }
}

loadPDFs();