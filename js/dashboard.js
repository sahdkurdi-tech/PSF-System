import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://lijeymdwahgbodzkpnqq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpamV5bWR3YWhnYm9kemtwbnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjMyOTYsImV4cCI6MjA4ODEzOTI5Nn0.dEAbEl5Ld7ETCxgxxSiYFuNQ4ZyuV0wO0dbGfdZzro8';
const supabase = createClient(supabaseUrl, supabaseKey);

// پشکنینی چوونەژوورەوە
async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
    }
}
checkUser();

const uploadBtn = document.getElementById("uploadBtn");
const statusMsg = document.getElementById("status-msg");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

uploadBtn.addEventListener("click", async () => {
    const nameInput = document.getElementById("pdfName").value.trim();
    const fileInput = document.getElementById("pdfFile").files[0];

    if (!nameInput || !fileInput) {
        statusMsg.style.color = "red";
        statusMsg.innerText = "تکایە ناوێک بنووسە و فایلێک هەڵبژێرە!";
        return;
    }

    const fileExt = fileInput.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // دروستکردنی کێشی فایلەکە
    const fileSizeMB = (fileInput.size / (1024 * 1024)).toFixed(2) + ' MB';

    uploadBtn.disabled = true;
    progressContainer.style.display = "block";
    progressBar.style.width = '50%'; 
    progressText.innerText = 'لە بارکردندایە...';
    statusMsg.innerText = "خەریکی بارکردنی فایلەکەین...";
    statusMsg.style.color = "#4f46e5";

    try {
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('pdfs')
            .upload(fileName, fileInput, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('pdfs')
            .getPublicUrl(fileName);

        progressBar.style.width = '80%';

        const { error: dbError } = await supabase
            .from('pdfs')
            .insert([
                { 
                    name: nameInput, 
                    file_url: publicUrl, 
                    file_size: fileSizeMB,
                    print_count: 0,
                    open_count: 0
                }
            ]);

        if (dbError) throw dbError;

        progressBar.style.width = '100%';
        progressText.innerText = '١٠٠%';
        statusMsg.style.color = "#10b981";
        statusMsg.innerText = "فایلەکە بە سەرکەوتوویی زیادکرا!";
        
        loadAdminPDFs();
        
        document.getElementById("pdfName").value = "";
        document.getElementById("pdfFile").value = "";
        
        setTimeout(() => {
            progressContainer.style.display = "none";
            progressBar.style.width = '0%';
        }, 2000);

    } catch (error) {
        console.error(error);
        statusMsg.style.color = "red";
        statusMsg.innerText = "هەڵەیەک ڕوویدا: " + error.message;
    } finally {
        uploadBtn.disabled = false;
    }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
});

const filesTableBody = document.getElementById("filesTableBody");

async function loadAdminPDFs() {
    try {
        const { data: pdfs, error } = await supabase
            .from('pdfs')
            .select('*')
            .order('sort_order', { ascending: true }) 
            .order('created_at', { ascending: false });

        if (error) throw error;

        filesTableBody.innerHTML = "";

        if (!pdfs || pdfs.length === 0) {
            filesTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:gray; padding: 20px;">هیچ فایلێک نییە.</td></tr>`;
            return;
        }

        pdfs.forEach((doc) => {
            const date = new Date(doc.created_at).toLocaleDateString('ku-IQ');
            const size = doc.file_size || 'نەزانراو'; // لەبری N/A ئەگەر کۆن بوو
            const prints = doc.print_count || 0;
            const opens = doc.open_count || 0;

            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td class="drag-handle" title="ڕایبکێشە بۆ گۆڕینی ڕیزبەندی">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h.01M16 6h.01M8 12h.01M16 12h.01M8 18h.01M16 18h.01"/></svg>
                </td>
                <td>${doc.name}</td>
                <td style="font-weight: normal; color: #64748b;" dir="ltr">${size}</td>
                <td style="font-weight: normal; color: #10b981; font-size: 13px;">👁️ ${opens} | 🖨️ ${prints}</td>
                <td style="font-weight: normal; color: #64748b; font-size: 14px;">${date}</td>
                <td style="text-align: left;">
                    <button class="btn-delete" data-id="${doc.id}" data-url="${doc.file_url}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        سڕینەوە
                    </button>
                </td>
            `;
            filesTableBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const url = e.currentTarget.getAttribute('data-url');
                await deleteFile(id, url, e.currentTarget);
            });
        });

        if (window.mySortable) {
            window.mySortable.destroy(); 
        }

        window.mySortable = new Sortable(filesTableBody, {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: async function () {
                statusMsg.style.display = "block";
                statusMsg.innerText = "خەریکی خەزنکردنی ڕیزبەندییەکەین...";
                statusMsg.style.color = "#4f46e5";

                const rows = filesTableBody.querySelectorAll('tr');
                const updates = [];
                
                rows.forEach((row, newIndex) => {
                    const btn = row.querySelector('.btn-delete');
                    if(btn) {
                        const id = btn.getAttribute('data-id');
                        updates.push({ id: id, sort_order: newIndex });
                    }
                });

                try {
                    const updatePromises = updates.map(update => 
                        supabase.from('pdfs').update({ sort_order: update.sort_order }).eq('id', update.id)
                    );
                    
                    const results = await Promise.all(updatePromises);
                    
                    const hasError = results.find(res => res.error);
                    if (hasError) throw hasError.error;

                    statusMsg.style.color = "#10b981";
                    statusMsg.innerText = "ڕیزبەندییەکە بە سەرکەوتوویی خەزن کرا!";
                    
                    setTimeout(() => { 
                        if(statusMsg.innerText === "ڕیزبەندییەکە بە سەرکەوتوویی خەزن کرا!") {
                            statusMsg.innerText = ""; 
                        }
                    }, 3000);

                } catch (err) {
                    console.error("کێشە لە خەزنکردنی ڕیزبەندی:", err);
                    statusMsg.style.color = "red";
                    statusMsg.innerText = "هەڵەیەک ڕوویدا لە خەزنکردنی ڕیزبەندییەکە!";
                }
            }
        });

    } catch (error) {
        console.error("هەڵە لە هێنانی فایلەکان:", error);
        filesTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">کێشەیەک هەیە لە هێنانی فایلەکان.</td></tr>`;
    }
}

async function deleteFile(id, url, btnElement) {
    const confirmed = confirm("دڵنیایت لە سڕینەوەی ئەم فایلە؟ ئەم کردارە پاشگەزبوونەوەی تێدا نییە.");
    if (!confirmed) return;

    const originalText = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerText = "دەسڕێتەوە...";

    try {
        const fileName = url.split('/').pop();

        const { error: storageError } = await supabase.storage
            .from('pdfs')
            .remove([fileName]);
        
        if (storageError) throw storageError;

        const { error: dbError } = await supabase
            .from('pdfs')
            .delete()
            .eq('id', id);
        
        if (dbError) throw dbError;

        loadAdminPDFs();

    } catch (error) {
        console.error(error);
        alert("کێشەیەک ڕوویدا لە سڕینەوەی فایلەکە: " + error.message);
        btnElement.disabled = false;
        btnElement.innerHTML = originalText;
    }
}

loadAdminPDFs();

const viewerLinkInput = document.getElementById('viewerLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');

const currentUrl = window.location.href;
const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
viewerLinkInput.value = `${baseUrl}/viewer.html`;

copyLinkBtn.addEventListener('click', () => {
    viewerLinkInput.select();
    document.execCommand('copy');
    
    const originalText = copyLinkBtn.innerText;
    copyLinkBtn.innerText = 'کۆپی کرا!';
    copyLinkBtn.style.background = '#10b981'; 
    
    setTimeout(() => {
        copyLinkBtn.innerText = originalText;
        copyLinkBtn.style.background = ''; 
    }, 2000);
});