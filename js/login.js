import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// لێرەدا URL و Key ی پڕۆژەکەی خۆت دابنێ کە لە Supabase کۆپیت کردوون
const supabaseUrl = 'https://lijeymdwahgbodzkpnqq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpamV5bWR3YWhnYm9kemtwbnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjMyOTYsImV4cCI6MjA4ODEzOTI5Nn0.dEAbEl5Ld7ETCxgxxSiYFuNQ4ZyuV0wO0dbGfdZzro8';
const supabase = createClient(supabaseUrl, supabaseKey);

// پشکنین: ئەگەر پێشتر چووبێتە ژوورەوە، ڕاستەوخۆ بیبە بۆ داشبۆرد
async function checkExistingSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = "dashboard.html";
    }
}
checkExistingSession();

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("error-msg");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // ڕێگریکردن لە ڕیفرێش بوونی پەڕەکە

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        errorMsg.innerText = "تکایە هەردوو خانەکە پڕبکەرەوە!";
        return;
    }

    // گۆڕینی شێوەی دوگمەکە بۆ کاتی لۆدینگ
    loginBtn.disabled = true;
    loginBtn.innerText = "چاوەڕێ بە...";
    errorMsg.innerText = "";

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            throw error;
        }

        // ئەگەر سەرکەوتوو بوو، بیبە بۆ داشبۆرد
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("هەڵەی چوونەژوورەوە:", error.message);
        // گۆڕینی پەیامی هەڵە بۆ کوردی
        if (error.message.includes("Invalid login credentials")) {
            errorMsg.innerText = "ئیمەیڵ یان وشەی نهێنی هەڵەیە!";
        } else {
            errorMsg.innerText = "هەڵەیەک ڕوویدا، تکایە دڵنیابە لە ئینتەرنێتەکەت.";
        }
        loginBtn.disabled = false;
        loginBtn.innerText = "چوونەژوورەوە";
    }
});