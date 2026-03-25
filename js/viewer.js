import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://zmopwbclwislhqecwmoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptb3B3YmNsd2lzbGhxZWN3bW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzE3NDYsImV4cCI6MjA5MDAwNzc0Nn0.5-tCqPSYSrh7mFXGewPewLz2YohS3uG2VR0FsWBT8AU';
const supabase = createClient(supabaseUrl, supabaseKey);

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function incrementBothStats(id) {
    try {
        const { data, error } = await supabase.from('pdfs').select('print_count, open_count').eq('id', id).single();
        if (!error && data) {
            const newPrint = data.print_count + 1;
            const newOpen = data.open_count + 1;
            const { error: updateError } = await supabase.from('pdfs').update({ 
                print_count: newPrint, 
                open_count: newOpen 
            }).eq('id', id);
            
            if (updateError) console.error('کێشە هەیە لە زیادکردنی ئامار:', updateError);
        }
    } catch (e) { 
        console.error('هەڵە:', e); 
    }
}

async function renderPdfThumbnail(url, container) {
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); 
        
        const viewport = page.getViewport({ scale: 1.5 }); 
        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-canvas';
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        container.innerHTML = ''; 
        container.appendChild(canvas);
    } catch (error) {
        console.error('هەڵە لە وێنەی پێشەکی:', error);
        container.innerHTML = '<span style="color:gray; font-size:14px;">بەردەست نییە</span>';
    }
}

async function directPrint(id, url, btnElement) {
    incrementBothStats(id);

    const originalText = btnElement.innerHTML;
    try {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="spinner-small" style="width:18px; height:18px; border-width:2px;"></div> ئامادەکردن...';

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            window.open(url, '_blank');
            btnElement.disabled = false;
            btnElement.innerHTML = originalText;
            return; 
        }

        const response = await fetch(url);
        const data = await response.blob();
        
        const blob = new Blob([data], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        
        const printFrame = document.getElementById('print-iframe');
        printFrame.src = blobUrl;
        
        printFrame.onload = () => {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
            
            btnElement.disabled = false;
            btnElement.innerHTML = originalText;
            
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        };
    } catch (error) {
        console.error('هەڵە لە چاپکردن:', error);
        alert("کێشەیەک هەیە لە پەیوەندی بە پرینتەرەوە، تکایە ڕاستەوخۆ فایلەکە بکەرەوە و چاپی بکە.");
        btnElement.disabled = false;
        btnElement.innerHTML = originalText;
        window.open(url, '_blank'); 
    }
}

async function loadPDFs() {
    const gridDiv = document.getElementById("pdf-grid");
    
    try {
        const { data: pdfs, error } = await supabase
            .from('pdfs')
            .select('*')
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
            const card = document.createElement('div');
            card.className = 'pdf-card';
            card.style.animationDelay = `${delay}s`;

            // زیادکردنی دوگمەی ناردن لە تەنیشت چاپکردن
            card.innerHTML = `
                <div class="pdf-title" title="${doc.name}">${doc.name}</div>
                <div style="text-align:center; margin-top:-10px; margin-bottom:5px;">
                    <span style="color: gray; font-size: 13px;" dir="ltr">${doc.file_size || ''}</span>
                </div>
                <div class="paper-preview-wrapper">
                    <div class="spinner-small"></div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-share" title="ناردن">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        ناردن
                    </button>
                    <button class="btn btn-print" title="چاپکردن">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        چاپکردن
                    </button>
                </div>
            `;
            gridDiv.appendChild(card);

            // ئیشپێکردنی دوگمەی چاپکردن
            const printBtn = card.querySelector('.btn-print');
            printBtn.addEventListener('click', () => directPrint(doc.id, doc.file_url, printBtn));

            // ئیشپێکردنی دوگمەی ناردن (Share)
            const shareBtn = card.querySelector('.btn-share');
            shareBtn.addEventListener('click', async () => {
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: doc.name,
                            text: `تکایە سەیری ئەم فایلە بکە: ${doc.name}`,
                            url: doc.file_url
                        });
                    } catch (err) {
                        console.log('پرۆسەی ناردن هەڵوەشایەوە یان سەرکەوتوو نەبوو.');
                    }
                } else {
                    // ئەگەر ئامێرەکە پشتگیری ناردنی نەکرد، لینکەکەی بۆ کۆپی دەکات
                    navigator.clipboard.writeText(doc.file_url);
                    const originalHTML = shareBtn.innerHTML;
                    shareBtn.innerHTML = '<span style="font-size: 14px;">کۆپی کرا!</span>';
                    setTimeout(() => { shareBtn.innerHTML = originalHTML; }, 2000);
                }
            });

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

const viewToggleBtn = document.getElementById('viewToggleBtn');
const pdfGrid = document.getElementById('pdf-grid');

const listIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>`;
const gridIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`;

const currentView = localStorage.getItem('viewMode') || 'list';

if (currentView === 'list') {
    pdfGrid.classList.add('list-view');
    if (viewToggleBtn) viewToggleBtn.innerHTML = gridIcon;
} else {
    pdfGrid.classList.remove('list-view'); 
    if (viewToggleBtn) viewToggleBtn.innerHTML = listIcon;
}

if (viewToggleBtn) {
    viewToggleBtn.addEventListener('click', () => {
        pdfGrid.classList.toggle('list-view');
        
        if (pdfGrid.classList.contains('list-view')) {
            localStorage.setItem('viewMode', 'list'); 
            viewToggleBtn.innerHTML = gridIcon; 
        } else {
            localStorage.setItem('viewMode', 'grid'); 
            viewToggleBtn.innerHTML = listIcon; 
        }
    });
}

// ==========================================
// چاودێریکردنی گۆڕانکارییەکان لەلایەن داشبۆردەوە (Realtime)
// ==========================================
supabase
  .channel('public:pdfs')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'pdfs' },
    (payload) => {
      // زۆر گرنگ: بۆ ئەوەی ئاگادارییەکە دەرنەکەوێت تەنها لەبەر ئەوەی کەسێک فایلێکی چاپ کردووە یان کردوویەتیەوە
      if (payload.eventType === 'UPDATE' && payload.old && payload.new) {
          if (payload.old.print_count !== payload.new.print_count || 
              payload.old.open_count !== payload.new.open_count) {
              return; // پشتگوێی بخە و هیچ مەکە
          }
      }
      
      // ئەگەر گۆڕانکارییەکە زیادکردن، سڕینەوە، یان گۆڕینی ڕیزبەندی بوو، ئاگادارییەکە پیشان بدە
      const toast = document.getElementById('updateToast');
      if (toast) {
          toast.style.display = 'flex';
      }
    }
  )
  .subscribe();