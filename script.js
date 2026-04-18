/* ===== STATE ===== */
let currentType = 'expense';
let myChart = null;
const API_BASE = '/api';

/* ===== CUSTOM CURSOR ===== */
(function initCursor() {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;

    let mx = -100, my = -100, rx = -100, ry = -100;

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
    });

    function animRing() {
        rx += (mx - rx) * 0.14;
        ry += (my - ry) * 0.14;
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
        requestAnimationFrame(animRing);
    }
    animRing();

    document.addEventListener('mousedown', () => {
        dot.style.transform = 'translate(-50%,-50%) scale(2)';
        ring.style.transform = 'translate(-50%,-50%) scale(0.6)';
    });
    document.addEventListener('mouseup', () => {
        dot.style.transform = 'translate(-50%,-50%) scale(1)';
        ring.style.transform = 'translate(-50%,-50%) scale(1)';
    });

    // FIX 1: Event delegation so dynamically added .delete buttons get cursor effect too
    document.addEventListener('mouseover', e => {
        if (e.target.matches('button, a, input, select, .delete, .reset-icon')) {
            ring.style.transform = 'translate(-50%,-50%) scale(1.8)';
            ring.style.borderColor = 'rgba(0,212,255,0.8)';
        }
    });
    document.addEventListener('mouseout', e => {
        if (e.target.matches('button, a, input, select, .delete, .reset-icon')) {
            ring.style.transform = 'translate(-50%,-50%) scale(1)';
            ring.style.borderColor = 'rgba(0,212,255,0.5)';
        }
    });
})();

/* ===== STARS ===== */
function createStars() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 1.4 + 0.3,
        speed: Math.random() * 0.012 + 0.003,
        opacity: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleDir: Math.random() > 0.5 ? 1 : -1
    }));

    // FIX 2: Clamp star positions on resize so they don't fly off screen
    window.addEventListener('resize', () => {
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = W; canvas.height = H;
        stars.forEach(s => {
            s.x = Math.min(s.x, W);
            s.y = Math.min(s.y, H);
        });
    });

    function animate() {
        ctx.clearRect(0, 0, W, H);
        stars.forEach(s => {
            s.opacity += s.twinkleSpeed * s.twinkleDir;
            if (s.opacity > 0.9 || s.opacity < 0.1) s.twinkleDir *= -1;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
            ctx.fill();
            s.y += s.speed;
            if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
        });
        requestAnimationFrame(animate);
    }
    animate();
}

/* ===== TOAST ===== */
function showToast(msg, type = 'info', duration = 3000) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// FIX 3: Toast-based confirm replaces blocking browser confirm()
function showConfirm(msg, onConfirm) {
    const container = document.getElementById('toastContainer');
    if (!container) { if (confirm(msg)) onConfirm(); return; }
    const toast = document.createElement('div');
    toast.className = 'toast warning';
    toast.style.cssText = 'flex-direction:column;align-items:flex-start;gap:10px;';
    toast.innerHTML = `
        <span style="display:flex;gap:8px;align-items:center;">⚠️ <span>${msg}</span></span>
        <div style="display:flex;gap:8px;width:100%;">
            <button id="confirmYes" style="flex:1;padding:7px;border-radius:8px;border:none;
                background:rgba(239,68,68,0.85);color:white;font-weight:700;cursor:pointer;
                font-family:'Space Grotesk',sans-serif;font-size:0.82rem;">Yes, delete</button>
            <button id="confirmNo" style="flex:1;padding:7px;border-radius:8px;
                border:1px solid rgba(255,255,255,0.15);background:transparent;color:#ccc;
                font-weight:600;cursor:pointer;font-family:'Space Grotesk',sans-serif;font-size:0.82rem;">Cancel</button>
        </div>`;
    container.appendChild(toast);
    const remove = () => { toast.classList.add('hiding'); setTimeout(() => toast.remove(), 300); };
    toast.querySelector('#confirmYes').addEventListener('click', () => { remove(); onConfirm(); });
    toast.querySelector('#confirmNo').addEventListener('click', remove);
}

/* ===== RIPPLE ===== */
function addRipple(btn, clientX, clientY) {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `width:${size}px;height:${size}px;
        left:${clientX - rect.left - size/2}px;top:${clientY - rect.top - size/2}px;`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
}

/* ===== PARTICLE BURST ===== */
function burst(x, y, color = '#00d4ff') {
    for (let i = 0; i < 10; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const angle = (i / 10) * 360;
        const dist = 40 + Math.random() * 40;
        p.style.cssText = `left:${x}px;top:${y}px;background:${color};
            --tx:${Math.cos(angle*Math.PI/180)*dist}px;--ty:${Math.sin(angle*Math.PI/180)*dist}px;`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }
}

/* ===== API ===== */
async function fetchTransactions() {
    try {
        const res = await fetch(`${API_BASE}/transactions`);
        if (!res.ok) throw new Error();
        return await res.json();
    } catch { return []; }
}

async function fetchSummary() {
    try {
        const res = await fetch(`${API_BASE}/summary`);
        if (!res.ok) throw new Error();
        return await res.json();
    } catch { return { total_expense: 0, category_breakdown: {} }; }
}

/* ===== TYPE TOGGLE ===== */
function setType(type) {
    currentType = type;
    const expBtn = document.getElementById('btn-expense');
    const incBtn = document.getElementById('btn-income');
    if (!expBtn || !incBtn) return;
    expBtn.className = 'type-btn' + (type === 'expense' ? ' active-expense' : '');
    incBtn.className = 'type-btn' + (type === 'income' ? ' active-income' : '');
}

/* ===== ADD TRANSACTION ===== */
// FIX 4: Pass event directly from onclick, no window.event (deprecated & Firefox broken)
async function addTransaction(e) {
    const btn = document.getElementById('submitBtn');
    if (btn && e) addRipple(btn, e.clientX, e.clientY);

    const name = document.getElementById('name')?.value.trim();
    const amountStr = document.getElementById('amount')?.value;
    const date = document.getElementById('date')?.value;
    const category = document.getElementById('category')?.value;

    if (!name || !amountStr || !date || !category) {
        showToast('Please fill in all fields', 'error');
        shakeCard();
        return;
    }
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
        showToast('Enter a valid positive amount', 'error');
        return;
    }

    if (btn) { btn.textContent = 'Adding…'; btn.classList.add('loading'); }

    try {
        const res = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, amount, date, category, type: currentType })
        });

        if (res.ok) {
            const bRect = btn?.getBoundingClientRect();
            if (bRect) burst(bRect.left + bRect.width/2, bRect.top + bRect.height/2,
                currentType === 'income' ? '#10b981' : '#00d4ff');
            showToast(`${currentType === 'income' ? 'Income' : 'Expense'} added! ₹${amount.toFixed(2)}`, 'success');
            document.getElementById('name').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            await loadAllData();
        } else {
            showToast('Failed to add transaction', 'error');
        }
    } catch {
        showToast('Cannot connect to server. Is Flask running?', 'error');
    } finally {
        if (btn) { btn.textContent = 'Add Transaction'; btn.classList.remove('loading'); }
    }
}

function shakeCard() {
    const card = document.getElementById('submitBtn')?.closest('.card');
    if (!card) return;
    card.style.transition = 'transform 0.08s ease';
    [-8, 8, -5, 5, 0].forEach((x, i) =>
        setTimeout(() => { card.style.transform = `translateX(${x}px)`; }, i * 80)
    );
    setTimeout(() => { card.style.transition = ''; }, 500);
}

/* ===== DELETE ===== */
async function deleteTransaction(id, el) {
    showConfirm('Delete this transaction?', async () => {
        const txn = el?.closest('.transaction');
        if (txn) { txn.style.transition = 'all 0.3s ease'; txn.style.opacity = '0'; txn.style.transform = 'translateX(40px)'; }
        try {
            await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
            showToast('Transaction deleted', 'info');
            setTimeout(() => loadAllData(), 300);
        } catch {
            showToast('Delete failed', 'error');
            if (txn) { txn.style.opacity = '1'; txn.style.transform = ''; }
        }
    });
}

/* ===== RESET ===== */
async function resetData() {
    showConfirm('Reset ALL data? This cannot be undone!', async () => {
        try {
            const transactions = await fetchTransactions();
            await Promise.all(transactions.map(t =>
                fetch(`${API_BASE}/transactions/${t.id}`, { method: 'DELETE' })
            ));
            showToast('All data cleared', 'info');
            await loadAllData();
        } catch { showToast('Reset failed', 'error'); }
    });
}

/* ===== ANIMATED COUNTER ===== */
function animateCount(el, target) {
    if (!el) return;
    const start = parseFloat(el.textContent.replace(/,/g, '')) || 0;
    const diff = target - start;
    const startTime = performance.now();
    function step(now) {
        const t = Math.min((now - startTime) / 600, 1);
        el.textContent = (start + diff * (1 - Math.pow(1 - t, 3))).toFixed(2);
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(2);
    }
    requestAnimationFrame(step);
}

/* ===== HELPERS ===== */
function getCatBadge(cat) {
    const icons = { Food: '🍛', Travel: '✈️', Bills: '💡', Shopping: '🛍️', Others: '📦' };
    return `<span class="cat-badge">${icons[cat] || '•'} ${cat}</span>`;
}

function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ===== LOAD ALL DATA ===== */
async function loadAllData() {
    const [transactions, summary] = await Promise.all([fetchTransactions(), fetchSummary()]);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

    animateCount(document.getElementById('expenseNum'), summary.total_expense);
    animateCount(document.getElementById('incomeNum'), totalIncome);

    const listEl = document.getElementById('list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (transactions.length === 0) {
        listEl.innerHTML = `<div class="empty-state">
            <div class="empty-icon">💸</div>
            <p>No transactions yet.</p>
            <small style="color:var(--text-secondary);font-size:0.8rem;">Add one above to get started!</small>
        </div>`;
        updateChart({});
        return;
    }

    transactions.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = `transaction type-${t.type}`;
        div.style.animationDelay = `${i * 0.04}s`;
        div.innerHTML = `
            <div class="txn-left">
                <span class="txn-name">${escHtml(t.name)}</span>
                <span class="txn-meta">${getCatBadge(t.category)}<span>${t.date}</span></span>
            </div>
            <div class="txn-right">
                <span class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '−'}₹${t.amount.toFixed(2)}</span>
                <span class="delete" onclick="deleteTransaction(${t.id}, this)" title="Delete">×</span>
            </div>`;
        listEl.appendChild(div);
    });

    updateChart(summary.category_breakdown);
}

/* ===== CHART ===== */
function updateChart(categoryData) {
    const ctx = document.getElementById('chart');
    if (!ctx) return;
    if (myChart) myChart.destroy();
    const keys = Object.keys(categoryData);
    const vals = Object.values(categoryData);

    if (keys.length === 0) {
        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['No data'], datasets: [{ data: [1], backgroundColor: ['rgba(255,255,255,0.05)'], borderColor: 'transparent' }] },
            options: { plugins: { legend: { labels: { color: '#8892a4', font: { family: 'Space Grotesk' } } } } }
        });
        return;
    }

    const palette = ['#00d4ff','#7c3aed','#f59e0b','#10b981','#ec4899','#3b82f6','#ef4444'];
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: keys,
            datasets: [{
                data: vals,
                backgroundColor: palette.map(c => c + '33'),
                borderColor: palette, borderWidth: 2,
                hoverBackgroundColor: palette.map(c => c + '66'), hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            animation: { animateRotate: true, animateScale: true, duration: 800, easing: 'easeOutQuart' },
            plugins: {
                legend: { position: 'bottom', labels: { color: '#e0e8ff', padding: 16,
                    font: { family: 'Space Grotesk', weight: '600', size: 13 }, usePointStyle: true, pointStyle: 'circle' } },
                tooltip: { backgroundColor: 'rgba(5,8,16,0.95)', borderColor: 'rgba(0,212,255,0.3)', borderWidth: 1,
                    titleFont: { family: 'Syne', size: 14 }, bodyFont: { family: 'Space Grotesk', size: 13 },
                    callbacks: { label: ctx => ` ₹${ctx.parsed.toFixed(2)}` } }
            }
        }
    });
}

/* ===== MONTHLY VIEW ===== */
async function renderMonthly() {
    const transactions = await fetchTransactions();
    const container = document.getElementById('monthlyList');
    if (!container) return;
    container.innerHTML = '';

    const grouped = {};
    transactions.forEach(t => { if (!grouped[t.date]) grouped[t.date] = []; grouped[t.date].push(t); });

    const dates = Object.keys(grouped).sort().reverse();
    if (dates.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><p>No transactions found.</p></div>`;
        return;
    }

    dates.forEach((date, gi) => {
        const txns = grouped[date];
        // FIX 5: Show expense and income totals separately with correct sign and colour
        const expTotal = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const incTotal = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        let totalLabel = '';
        if (expTotal > 0) totalLabel += `<span style="color:var(--expense)">−₹${expTotal.toFixed(2)}</span>`;
        if (expTotal > 0 && incTotal > 0) totalLabel += `<span style="margin:0 5px;opacity:0.4">·</span>`;
        if (incTotal > 0) totalLabel += `<span style="color:var(--income)">+₹${incTotal.toFixed(2)}</span>`;

        const group = document.createElement('div');
        group.className = 'monthly-group';
        group.style.animationDelay = `${gi * 0.07}s`;

        let inner = `<div class="monthly-date-header">
            <h4>${formatDate(date)}</h4>
            <span class="date-total">${totalLabel}</span>
        </div>`;

        txns.forEach(t => {
            inner += `<div class="transaction type-${t.type}" style="margin-bottom:8px;">
                <div class="txn-left">
                    <span class="txn-name">${escHtml(t.name)}</span>
                    <span class="txn-meta">${getCatBadge(t.category)}</span>
                </div>
                <span class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '−'}₹${t.amount.toFixed(2)}</span>
            </div>`;
        });

        group.innerHTML = inner;
        container.appendChild(group);
    });
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ===== INIT ===== */
window.onload = () => {
    createStars();
    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    if (document.getElementById('list')) loadAllData();
    if (document.getElementById('monthlyList')) renderMonthly();
};
