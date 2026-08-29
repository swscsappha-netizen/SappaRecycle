/**
 * SAPPARECYCLE - LINE LIFF APPLICATION CONTROLLER
 * Full Features:
 * - Universal Mobile Responsiveness & Safe Area Support
 * - Realtime Supabase Cloud Sync
 * - Student Council Scanner & Verification Flow
 * - Super Admin Portal: Live Point Adjustments & Coupon Issuer/Delete Manager
 */

(function () {
  'use strict';

  // App State
  let supabaseClient = null;
  let currentTab = 'tab-home';
  let activeStudent = null;
  let currentLineProfile = null;
  let qrScannerInstance = null;
  let pendingRedeemReward = null;
  let pendingVerifyCoupon = null;
  let adminTargetStudent = null;
  
  let selectedHomeCategory = 'all';
  let selectedStoreCategory = 'all';

  let rewardsData = [];
  let couponsData = [];
  let recycleLogsData = [];
  let adminAllCouponsData = [];

  const PASTEL_COLORS = ['#E3F2FD', '#FFF9C4', '#FFE0B2', '#E8F5E9', '#F3E5F5'];

  // Default Rewards Fallback
  const DEFAULT_REWARDS = [
    {
      reward_id: '00000000-0000-0000-0000-000000000001',
      title: 'ปากกาเจลรักษ์โลก (Eco Gel Pen)',
      category: 'stationery',
      points_required: 30,
      stock_quantity: 150,
      image_url: 'https://images.unsplash.com/photo-1585336261026-7756f7ef0cf4?w=400&q=80'
    },
    {
      reward_id: '00000000-0000-0000-0000-000000000002',
      title: 'สมุดบันทึก Green Earth A5',
      category: 'stationery',
      points_required: 50,
      stock_quantity: 80,
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80'
    },
    {
      reward_id: '00000000-0000-0000-0000-000000000003',
      title: 'ใบเพิ่มคะแนนคุณลักษณะ +5 คะแนน',
      category: 'character',
      points_required: 100,
      stock_quantity: 50,
      image_url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=400&q=80'
    },
    {
      reward_id: '00000000-0000-0000-0000-000000000004',
      title: 'รูบิคฝึกสมอง / ของเล่นเสริมทักษะ',
      category: 'toy',
      points_required: 150,
      stock_quantity: 30,
      image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80'
    },
    {
      reward_id: '00000000-0000-0000-0000-000000000005',
      title: 'โมเดลตัวต่อรักษ์โลก Eco Blocks',
      category: 'toy',
      points_required: 200,
      stock_quantity: 20,
      image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80'
    }
  ];

  // --------------------------------------------------------------------------
  // 1. Boot & Setup
  // --------------------------------------------------------------------------
  async function initApp() {
    bindEvents();

    // 1. Supabase Init
    if (window.supabase && window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL) {
      try {
        supabaseClient = window.supabase.createClient(
          window.APP_CONFIG.SUPABASE_URL,
          window.APP_CONFIG.SUPABASE_ANON_KEY
        );
        console.log("✅ Supabase Client Connected:", window.APP_CONFIG.SUPABASE_URL);
      } catch (e) {
        console.error("Supabase init error:", e);
      }
    }

    // 2. Strict LINE LIFF Init & Enforcement
    let liffLoggedIn = false;
    if (window.liff && window.APP_CONFIG && window.APP_CONFIG.LIFF_ID) {
      try {
        await liff.init({ liffId: window.APP_CONFIG.LIFF_ID });
        if (liff.isLoggedIn()) {
          liffLoggedIn = true;
          currentLineProfile = await liff.getProfile();
          console.log("🟢 LINE Profile Active:", currentLineProfile.displayName, currentLineProfile.userId);
        } else {
          // Strict LINE Login: User must authenticate with LINE OAuth!
          console.log("🔒 Not logged in to LINE -> Initiating LINE Login...");
          liff.login();
          return;
        }
      } catch (err) {
        console.warn("LIFF initialization error / local mode:", err);
      }
    }

    // 3. Resolve Authenticated Student Identity
    if (liffLoggedIn && currentLineProfile && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .eq('line_user_id', currentLineProfile.userId)
          .maybeSingle();

        if (data && !error) {
          // Existing linked student -> Login immediately!
          activeStudent = data;
          await fetchStudentCoupons();
          await fetchStudentRecycleLogs();
          renderAll();
          hideSplashScreen();
        } else {
          // First-time user in LINE -> Open Account Binding Modal
          openLineBindingModal(currentLineProfile);
          hideSplashScreen();
        }
      } catch (err) {
        console.warn("Error resolving student profile:", err);
        openLineBindingModal(currentLineProfile);
        hideSplashScreen();
      }
    } else {
      // Local development test fallback
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get('student_id') || '32650';
      await loginStudent(targetId);
      hideSplashScreen();
    }

    await fetchRewards();
  }

  function hideSplashScreen() {
    const splash = document.getElementById('app-splash-screen');
    if (splash) {
      splash.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => {
        if (splash.parentNode) splash.parentNode.removeChild(splash);
      }, 500);
    }
  }

  // --------------------------------------------------------------------------
  // LINE Account Binding Workflow (First-Time Registration)
  // --------------------------------------------------------------------------
  let pendingBindingStudent = null;

  function openLineBindingModal(profile) {
    if (!profile) return;
    const modal = document.getElementById('modal-line-bind');
    const avatarEl = document.getElementById('line-bind-avatar');
    const nameEl = document.getElementById('line-bind-display-name');

    if (avatarEl && profile.pictureUrl) avatarEl.src = profile.pictureUrl;
    if (nameEl) nameEl.textContent = `${profile.displayName} 🌿`;

    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  async function lookupStudentForBinding(studentId) {
    const previewBox = document.getElementById('line-bind-preview-box');
    const previewName = document.getElementById('line-bind-preview-name');
    const previewRoom = document.getElementById('line-bind-preview-room');

    if (!studentId || studentId.length !== 5 || !supabaseClient) {
      if (previewBox) previewBox.classList.add('hidden');
      pendingBindingStudent = null;
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('students')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      const confirmBtn = document.getElementById('btn-confirm-line-bind');

      if (data && !error) {
        if (data.line_user_id && currentLineProfile && data.line_user_id !== currentLineProfile.userId) {
          pendingBindingStudent = null;
          if (previewName) previewName.innerHTML = `<span class="text-error font-black">⚠️ รหัสนักเรียนนี้ถูกผูกบัญชี LINE ไปแล้ว</span>`;
          if (previewRoom) previewRoom.innerHTML = `<span class="text-on-surface-variant text-[11px] font-bold">หากมีคนแอบอ้างหรือทำโทรศัพท์หาย กรุณาติดต่อสภานักเรียนเพื่อขอปลดล็อก</span>`;
          if (previewBox) {
            previewBox.classList.remove('hidden');
            previewBox.classList.add('flex');
          }
          if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
          }
          return;
        }

        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        pendingBindingStudent = data;
        if (previewName) previewName.textContent = `✅ ${data.full_name}`;
        if (previewRoom) previewRoom.textContent = `ชั้น ${data.room} (เลขที่ ${data.no || '-'})`;
        if (previewBox) {
          previewBox.classList.remove('hidden');
          previewBox.classList.add('flex');
        }
      } else {
        pendingBindingStudent = null;
        if (previewName) previewName.textContent = '❌ ไม่พบรหัสนักเรียนนี้ในระบบ';
        if (previewRoom) previewRoom.textContent = 'กรุณาตรวจสอบรหัส 5 หลักอีกครั้ง';
        if (previewBox) {
          previewBox.classList.remove('hidden');
          previewBox.classList.add('flex');
        }
        if (confirmBtn) {
          confirmBtn.disabled = true;
          confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
      }
    } catch (err) {
      console.warn("Lookup error:", err);
    }
  }

  // --------------------------------------------------------------------------
  // Custom Toast & Modal Notification System
  // --------------------------------------------------------------------------
  function showToast(message, type = 'success', duration = 3200) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const isError = type === 'error';
    const isWarning = type === 'warning';
    const isInfo = type === 'info';

    const bgClass = isError
      ? 'bg-red-50 border-red-300 text-red-800'
      : isWarning
      ? 'bg-amber-50 border-amber-300 text-amber-900'
      : isInfo
      ? 'bg-blue-50 border-blue-300 text-blue-900'
      : 'bg-[#E8F8EE] border-[#86EFAC] text-[#006e1c]';

    const iconName = isError
      ? 'error'
      : isWarning
      ? 'warning'
      : isInfo
      ? 'info'
      : 'check_circle';

    toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-[20px] border-2 shadow-xl backdrop-blur-md animate-bounce-in transition-all duration-300 ${bgClass}`;
    toast.innerHTML = `
      <span class="material-symbols-rounded text-xl shrink-0" style="font-variation-settings: 'FILL' 1;">${iconName}</span>
      <span class="font-display font-extrabold text-[13px] leading-tight flex-1">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  window.showToast = showToast;

  function showBindingSuccessModal(student) {
    const modal = document.getElementById('modal-bind-success');
    const nameEl = document.getElementById('success-bind-name');
    const metaEl = document.getElementById('success-bind-meta');
    const descEl = document.getElementById('success-bind-desc');

    if (nameEl) nameEl.textContent = student.full_name;
    if (metaEl) metaEl.textContent = `รหัส: ${student.student_id} | ชั้น ${student.room} (เลขที่ ${student.no || '-'})`;
    if (descEl) descEl.textContent = `ผูกบัญชี LINE กับคุณ "${student.full_name}" เรียบร้อยแล้ว`;

    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  async function confirmLineBinding() {
    const studentIdInput = document.getElementById('line-bind-student-id').value.trim();
    const phoneInput = document.getElementById('line-bind-phone').value.trim();
    const confirmBtn = document.getElementById('btn-confirm-line-bind');

    if (!studentIdInput || studentIdInput.length !== 5) {
      showToast('กรุณาระบุรหัสนักเรียน 5 หลักให้ถูกต้อง', 'warning');
      return;
    }

    if (!pendingBindingStudent) {
      await lookupStudentForBinding(studentIdInput);
      if (!pendingBindingStudent) {
        showToast('ไม่พบรหัสนักเรียนนี้ในฐานข้อมูลโรงเรียนสรรพวิทยาคม', 'error');
        return;
      }
    }

    if (!currentLineProfile || !supabaseClient) {
      showToast('ไม่พบการเชื่อมต่อ LINE Account', 'error');
      return;
    }

    if (confirmBtn) {
      confirmBtn.innerHTML = 'กำลังผูกบัญชี... ⏳';
      confirmBtn.disabled = true;
    }

    try {
      const updatePayload = {
        line_user_id: currentLineProfile.userId
      };
      if (phoneInput && phoneInput.length >= 9) {
        updatePayload.phone_number = phoneInput;
      }

      const { data, error } = await supabaseClient
        .from('students')
        .update(updatePayload)
        .eq('student_id', pendingBindingStudent.student_id)
        .select()
        .single();

      if (error) throw error;

      activeStudent = data || pendingBindingStudent;

      const modal = document.getElementById('modal-line-bind');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }

      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      }

      showBindingSuccessModal(activeStudent);
      await fetchStudentCoupons();
      await fetchStudentRecycleLogs();
      renderAll();
    } catch (e) {
      console.error("Binding error:", e);
      showToast('เกิดข้อผิดพลาดในการผูกบัญชี: ' + (e.message || e), 'error');
    } finally {
      if (confirmBtn) {
        confirmBtn.innerHTML = 'ยืนยันผูกบัญชี LINE เข้าใช้งาน 🔗';
        confirmBtn.disabled = false;
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. Data Fetching
  // --------------------------------------------------------------------------
  async function loginStudent(studentId) {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .eq('student_id', studentId)
          .single();

        if (data && !error) {
          activeStudent = data;
          await fetchStudentCoupons();
          await fetchStudentRecycleLogs();
          renderAll();
          return;
        }
      } catch (err) {
        console.warn("Error fetching student:", err);
      }
    }

    activeStudent = {
      student_id: studentId,
      full_name: studentId === '32650' ? 'นายสุวรรณวัฒน์ ก้องเวหา' : 'เด็กชายชาญนนท์ -',
      room: studentId === '32650' ? 'ม.5/10' : 'ม.1/1',
      no: studentId === '32650' ? 7 : 1,
      phone_number: null,
      current_points: 0,
      total_bottles_recycled: 0,
      is_council_member: studentId === '32650'
    };

    renderAll();
  }

  async function fetchRewards() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('rewards')
          .select('*')
          .eq('is_active', true)
          .order('points_required', { ascending: true });

        if (data && !error && data.length > 0) {
          rewardsData = data;
          renderRewardStore();
          populateAdminRewardDropdown();
          return;
        }
      } catch (e) {
        console.warn("Could not fetch rewards:", e);
      }
    }
    rewardsData = DEFAULT_REWARDS;
    renderRewardStore();
    populateAdminRewardDropdown();
  }

  async function fetchStudentCoupons() {
    if (!activeStudent || !supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('coupons')
        .select('*, rewards(title, image_url)')
        .eq('student_id', activeStudent.student_id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        couponsData = data.map(c => ({
          coupon_id: c.coupon_id,
          student_id: c.student_id,
          coupon_code: c.coupon_code,
          status: c.status,
          created_at: c.created_at,
          redeemed_at: c.redeemed_at,
          reward_title: c.rewards?.title || 'ของรางวัล'
        }));
        renderCoupons();
      }
    } catch (e) {
      console.warn("Coupons fetch error:", e);
    }
  }

  async function fetchStudentRecycleLogs() {
    if (!activeStudent || !supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('recycle_logs')
        .select('*')
        .eq('student_id', activeStudent.student_id)
        .order('created_at', { ascending: false })
        .limit(15);

      if (data && !error) {
        recycleLogsData = data;
        renderHistory();
      }
    } catch (e) {
      console.warn("Logs fetch error:", e);
    }
  }

  // --------------------------------------------------------------------------
  // 3. Level & Rank Calculator
  // --------------------------------------------------------------------------
  function getRankInfo(totalBottles) {
    const count = totalBottles || 0;
    if (count < 10) {
      const needed = 10 - count;
      const pct = Math.round((count / 10) * 100);
      return { rank: '🌱 ต้นกล้าฝึกหัด', next: `อีก ${needed} ชิ้น อัปเลเวล!`, pct: Math.max(20, pct) };
    } else if (count < 30) {
      const needed = 30 - count;
      const pct = Math.round(((count - 10) / 20) * 100);
      return { rank: '🌿 ฮีโร่พิทักษ์ป่า', next: `อีก ${needed} ชิ้น เลเวลถัดไป!`, pct: Math.max(20, pct) };
    } else if (count < 60) {
      const needed = 60 - count;
      const pct = Math.round(((count - 30) / 30) * 100);
      return { rank: '🌳 พฤกษาผู้พิทักษ์โลก', next: `อีก ${needed} ชิ้น ขั้นสูงสุด!`, pct: Math.max(20, pct) };
    } else {
      return { rank: '👑 ยอดนักรีไซเคิลสรรพวิทย์', next: 'เลเวลสูงสุดแล้ว สุดยอดมาก! 🎉', pct: 100 };
    }
  }

  // --------------------------------------------------------------------------
  // 4. Rendering Functions
  // --------------------------------------------------------------------------
  function renderAll() {
    if (!activeStudent) return;
    renderHeader();
    renderDashboard();
    renderHistory();
    renderRewardStore();
    renderCoupons();
    renderProfile();
  }

  function renderHeader() {
    const rawName = activeStudent.full_name || 'นักเรียน';
    const cleanHeaderName = rawName.replace(/^(เด็กชาย|เด็กหญิง|นาย|นางสาว)/, '').trim();
    document.getElementById('header-user-name').textContent = cleanHeaderName || rawName;

    if (currentLineProfile && currentLineProfile.pictureUrl) {
      const avatarImg = document.querySelector('#btn-header-profile-avatar img');
      if (avatarImg) avatarImg.src = currentLineProfile.pictureUrl;
    }

    const isCouncil = activeStudent.student_id === '32650' && activeStudent.is_council_member === true;
    const roleBadgeEl = document.getElementById('header-role-badge');
    if (roleBadgeEl) {
      if (isCouncil) {
        roleBadgeEl.textContent = '★ สภานักเรียน';
        roleBadgeEl.className = 'text-[10px] sm:text-[11px] font-black text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded-full border border-[#fde047] leading-none inline-block';
      } else {
        roleBadgeEl.textContent = `${activeStudent.room} (เลขที่ ${activeStudent.no || '-'})`;
        roleBadgeEl.className = 'text-[10px] sm:text-[11px] font-extrabold text-on-surface-variant font-thai leading-none';
      }
    }
  }

  function renderDashboard() {
    document.getElementById('dash-student-id').textContent = activeStudent.student_id;
    document.getElementById('dash-points-balance').textContent = (activeStudent.current_points || 0).toLocaleString();
    document.getElementById('dash-student-room').textContent = `${activeStudent.room} (เลขที่ ${activeStudent.no || '-'})`;

    let petCount = 0;
    let canCount = 0;
    recycleLogsData.forEach(l => {
      if (l.item_type === 'PET') petCount += 1;
      else if (l.item_type === 'CAN') canCount += 1;
    });

    if (recycleLogsData.length === 0 && activeStudent.total_bottles_recycled > 0) {
      petCount = Math.round(activeStudent.total_bottles_recycled * 0.75);
      canCount = activeStudent.total_bottles_recycled - petCount;
    }

    document.getElementById('dash-pet-count').textContent = `${petCount} ชิ้น`;
    document.getElementById('dash-can-count').textContent = `${canCount} ชิ้น`;

    const rankInfo = getRankInfo(activeStudent.total_bottles_recycled);
    document.getElementById('dash-rank-badge').innerHTML = `<span class="material-symbols-rounded text-sm" style="font-variation-settings: 'FILL' 1;">eco</span> ${rankInfo.rank}`;
    document.getElementById('dash-rank-progress-text').textContent = rankInfo.next;
    document.getElementById('dash-rank-bar').style.width = `${rankInfo.pct}%`;
  }

  function renderHistory() {
    const listEl = document.getElementById('recent-history-list');
    let filteredLogs = recycleLogsData;
    if (selectedHomeCategory !== 'all') {
      filteredLogs = recycleLogsData.filter(l => l.item_type === selectedHomeCategory);
    }

    if (filteredLogs.length > 0) {
      listEl.innerHTML = filteredLogs.map(log => {
        const isPet = log.item_type === 'PET';
        return `
          <div class="bg-surface-container-lowest p-3 rounded-[20px] border-2 border-secondary-container flex items-center justify-between shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-[14px] ${isPet ? 'bg-[#E3F2FD] text-[#1976D2]' : 'bg-[#FFF9C4] text-[#F57F17]'} flex items-center justify-center font-bold">
                <span class="material-symbols-rounded">${isPet ? 'water_bottle' : 'inventory_2'}</span>
              </div>
              <div>
                <h4 class="font-display font-extrabold text-[14px] text-on-surface">${isPet ? 'ขวดพลาสติกใส PET' : 'กระป๋องอะลูมิเนียม CAN'}</h4>
                <p class="text-[11px] text-on-surface-variant font-bold">${new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
              </div>
            </div>
            <span class="font-display font-black text-[15px] text-primary bg-primary-container/20 px-2.5 py-1 rounded-full">+${log.points_earned} Pts</span>
          </div>
        `;
      }).join('');
    } else {
      listEl.innerHTML = `
        <div class="bg-surface-container-lowest p-5 rounded-[24px] border-2 border-secondary-container text-center text-[13px] text-on-surface-variant font-bold flex flex-col items-center gap-1">
          <span class="material-symbols-rounded text-3xl text-primary-container">recycling</span>
          <span>ยังไม่มีประวัติการหยอดขวดในหมวดนี้ ลองไปหยอดที่ตู้ดูนะ! ♻️</span>
        </div>
      `;
    }
  }

  function renderRewardStore() {
    const grid = document.getElementById('rewards-grid');
    if (rewardsData.length === 0) {
      grid.innerHTML = '<div class="col-span-2 text-center py-8 text-on-surface-variant font-bold">กำลังโหลดของรางวัล...</div>';
      return;
    }

    let displayRewards = rewardsData;
    if (selectedStoreCategory !== 'all') {
      displayRewards = rewardsData.filter(r => (r.category || 'stationery') === selectedStoreCategory);
    }

    if (displayRewards.length === 0) {
      grid.innerHTML = '<div class="col-span-2 text-center py-8 text-on-surface-variant font-bold">ไม่มีของรางวัลในหมวดนี้</div>';
      return;
    }

    grid.innerHTML = displayRewards.map((r, index) => {
      const userPts = activeStudent ? (activeStudent.current_points || 0) : 0;
      const canAfford = userPts >= r.points_required;
      const inStock = r.stock_quantity > 0;
      const bgColor = PASTEL_COLORS[index % PASTEL_COLORS.length];
      const isSoldOut = !inStock;
      const isInsufficient = inStock && !canAfford;
      const neededPts = Math.max(0, r.points_required - userPts);

      return `
        <div class="bg-surface-container-lowest rounded-[24px] sm:rounded-[32px] flex flex-col p-2 sm:p-2.5 reward-card h-full ${isSoldOut ? 'opacity-70 grayscale-[30%]' : ''}">
          <div class="h-28 sm:h-36 w-full rounded-[18px] sm:rounded-[24px] flex items-center justify-center relative p-3 sm:p-5 overflow-visible" style="background-color: ${isSoldOut ? '#E6E9E7' : bgColor};">
            <img alt="${r.title}" class="max-h-full object-contain drop-shadow-md transition-transform hover:scale-110 duration-300" src="${r.image_url}">
            
            <div class="absolute -top-2.5 -right-1.5 sm:-top-3 sm:-right-2 bg-surface-container-lowest px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border-2 shadow-sm rotate-3 illustrative-badge ${isSoldOut ? 'border-surface-variant text-on-surface-variant' : r.stock_quantity <= 3 ? 'border-error-container text-error' : 'border-[#BBDEFB] text-[#1976D2]'}">
              <span class="font-display text-[11px] sm:text-[13px] font-black tracking-tight whitespace-nowrap">
                ${isSoldOut ? '0 Left' : r.stock_quantity + ' Left'}
              </span>
            </div>
          </div>

          <div class="p-2 sm:p-3 pt-3 sm:pt-4 flex flex-col flex-grow justify-between gap-2.5 sm:gap-3.5 text-center">
            <div>
              <h3 class="font-display text-[13px] sm:text-[16px] text-on-surface font-extrabold leading-tight tracking-tight line-clamp-2">${r.title}</h3>
              <p class="font-display text-[13px] sm:text-[15px] text-[#F57F17] mt-0.5 sm:mt-1 font-black">${r.points_required.toLocaleString()} Pts</p>
            </div>

            ${isSoldOut ? `
              <button class="w-full bg-surface-variant text-on-surface-variant font-display text-[12px] sm:text-[14px] font-extrabold py-2.5 sm:py-3 rounded-[16px] sm:rounded-[20px] cursor-not-allowed btn-disabled flex items-center justify-center gap-1" onclick="window.showToast('ของรางวัลนี้หมดสต็อกชั่วคราว', 'warning')">
                <span class="material-symbols-rounded text-base sm:text-lg" style="font-variation-settings: 'FILL' 1;">block</span>
                Sold Out
              </button>
            ` : isInsufficient ? `
              <button class="w-full bg-surface-variant text-on-surface-variant font-display text-[11px] sm:text-[13px] font-extrabold py-2.5 sm:py-3 rounded-[16px] sm:rounded-[20px] cursor-pointer border-b-4 border-outline-variant flex items-center justify-center gap-1 hover:bg-surface-variant/80" onclick="window.showToast('สะสมอีก ${neededPts.toLocaleString()} แต้มเพื่อแลกชิ้นนี้ (หยอดขวด PET เพิ่มอีก ${Math.ceil(neededPts / 10)} ขวดนะ!)', 'info')">
                <span class="material-symbols-rounded text-base sm:text-lg" style="font-variation-settings: 'FILL' 1;">lock</span>
                Need ${neededPts.toLocaleString()}
              </button>
            ` : `
              <button class="w-full bg-primary-container text-on-primary font-display text-[13px] sm:text-[15px] font-extrabold py-2.5 sm:py-3 rounded-[16px] sm:rounded-[20px] btn-squishy hover:bg-primary border-b-4 border-on-primary-container flex items-center justify-center gap-1 shadow-sm btn-redeem cursor-pointer" data-reward-id="${r.reward_id}">
                <span class="material-symbols-rounded text-base sm:text-lg" style="font-variation-settings: 'FILL' 1;">redeem</span>
                Redeem
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.btn-redeem').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rId = e.currentTarget.getAttribute('data-reward-id');
        attemptRedeemReward(rId);
      });
    });
  }

  function renderCoupons() {
    const activeCoupons = couponsData.filter(c => c.status === 'ACTIVE');
    const usedCoupons = couponsData.filter(c => c.status === 'REDEEMED');

    document.getElementById('count-active-coupons').textContent = activeCoupons.length;
    document.getElementById('count-used-coupons').textContent = usedCoupons.length;

    const listEl = document.getElementById('coupons-list');
    const activeFilter = document.querySelector('.c-tab.active')?.getAttribute('data-filter') || 'ACTIVE';
    const displayList = activeFilter === 'ACTIVE' ? activeCoupons : usedCoupons;

    if (displayList.length === 0) {
      listEl.innerHTML = `
        <div class="bg-surface-container-lowest p-8 rounded-[28px] border-2 border-secondary-container text-center text-on-surface-variant font-bold flex flex-col items-center gap-2">
          <span class="material-symbols-rounded text-4xl text-primary-container">confirmation_number</span>
          <span>ไม่มีคูปองในหมวดนี้ ไปที่เมนู "แลกรางวัล" เพื่อแลกของได้เลย! 🎁</span>
        </div>
      `;
    } else {
      listEl.innerHTML = displayList.map(c => `
        <div class="bg-surface-container-lowest rounded-[28px] p-4 reward-card flex items-center justify-between cursor-pointer hover:border-primary-container transition-all" data-code="${c.coupon_code}">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-[16px] ${c.status === 'ACTIVE' ? 'bg-primary-container/20 text-primary' : 'bg-surface-variant text-on-surface-variant'} flex items-center justify-center">
              <span class="material-symbols-rounded text-2xl">${c.status === 'ACTIVE' ? 'local_activity' : 'check_circle'}</span>
            </div>
            <div>
              <h4 class="font-display font-extrabold text-[15px] text-on-surface">${c.reward_title}</h4>
              <p class="text-[12px] font-display text-on-surface-variant font-bold">Code: ${c.coupon_code}</p>
            </div>
          </div>
          <div class="${c.status === 'ACTIVE' ? 'bg-primary-container text-on-primary' : 'bg-surface-variant text-on-surface-variant'} font-display font-extrabold text-[12px] px-3.5 py-1.5 rounded-[16px] flex items-center gap-1 shadow-sm">
            <span class="material-symbols-rounded text-sm">qr_code</span> ${c.status === 'ACTIVE' ? 'View QR' : 'ใช้แล้ว'}
          </div>
        </div>
      `).join('');

      listEl.querySelectorAll('.reward-card').forEach(card => {
        card.addEventListener('click', () => {
          const code = card.getAttribute('data-code');
          showCouponQRModal(code);
        });
      });
    }
  }

  function renderProfile() {
    document.getElementById('prof-name').textContent = activeStudent.full_name;
    document.getElementById('prof-student-id').value = activeStudent.student_id;
    document.getElementById('prof-room').textContent = `ชั้น ${activeStudent.room} (เลขที่ ${activeStudent.no || '-'})`;
    document.getElementById('prof-phone').value = activeStudent.phone_number || '';

    // Dynamic Role-Based Buttons (Council Scanner & Admin Portal)
    const isCouncil = activeStudent.student_id === '32650' && activeStudent.is_council_member === true;
    const navCouncilCenter = document.getElementById('nav-council-center-item');
    const councilProfileBox = document.getElementById('box-council-profile-shortcut');
    const adminProfileBox = document.getElementById('box-admin-profile-shortcut');
    
    if (isCouncil) {
      if (navCouncilCenter) navCouncilCenter.style.display = 'block';
      if (councilProfileBox) councilProfileBox.style.display = 'block';
      if (adminProfileBox) adminProfileBox.style.display = 'block';
    } else {
      if (navCouncilCenter) navCouncilCenter.style.display = 'none';
      if (councilProfileBox) councilProfileBox.style.display = 'none';
      if (adminProfileBox) adminProfileBox.style.display = 'none';
      if (currentTab === 'view-scanner') switchTab('tab-home');
    }
  }

  // --------------------------------------------------------------------------
  // 5. Redemption & ADR-0001
  // --------------------------------------------------------------------------
  function attemptRedeemReward(rewardId) {
    const reward = rewardsData.find(r => r.reward_id === rewardId);
    if (!reward) return;

    if (!activeStudent.phone_number || activeStudent.phone_number.trim() === '') {
      pendingRedeemReward = reward;
      openWarningModal();
      return;
    }

    executeRedemption(reward);
  }

  function openWarningModal() {
    const modal = document.getElementById('modal-phone-required');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeWarningModal() {
    const modal = document.getElementById('modal-phone-required');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    pendingRedeemReward = null;
  }

  async function executeRedemption(reward) {
    if (activeStudent.current_points < reward.points_required) {
      alert('แต้มสะสมไม่เพียงพอ');
      return;
    }
    if (reward.stock_quantity <= 0) {
      alert('ของรางวัลหมดแล้ว');
      return;
    }

    const uniqueToken = 'CPN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.rpc('redeem_reward_coupon', {
          p_student_id: activeStudent.student_id,
          p_reward_id: reward.reward_id,
          p_coupon_code: uniqueToken
        });

        if (error) {
          await supabaseClient.from('coupons').insert({
            student_id: activeStudent.student_id,
            reward_id: reward.reward_id,
            coupon_code: uniqueToken,
            status: 'ACTIVE'
          });
          await supabaseClient.from('students').update({
            current_points: activeStudent.current_points - reward.points_required
          }).eq('student_id', activeStudent.student_id);
          await supabaseClient.from('rewards').update({
            stock_quantity: Math.max(0, reward.stock_quantity - 1)
          }).eq('reward_id', reward.reward_id);
        }
      } catch (err) {
        console.error("Redeem error:", err);
      }
    }

    await loginStudent(activeStudent.student_id);
    await fetchRewards();

    if (typeof confetti === 'function') {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    }
    showCouponQRModal(uniqueToken);
  }

  function showCouponQRModal(couponCode) {
    const coupon = couponsData.find(c => c.coupon_code === couponCode);
    const title = coupon ? coupon.reward_title : 'ของรางวัล';

    document.getElementById('modal-qr-title').textContent = title;
    document.getElementById('modal-qr-code-text').textContent = couponCode;

    const container = document.getElementById('qr-container');
    if (container) {
      container.innerHTML = '';

      let rendered = false;

      // Engine 1: QRCode instance
      try {
        if (typeof window.QRCode === 'function') {
          new window.QRCode(container, {
            text: couponCode,
            width: 190,
            height: 190,
            colorDark: '#004d13',
            colorLight: '#ffffff',
            correctLevel: (window.QRCode.CorrectLevel && window.QRCode.CorrectLevel.H) || 2
          });
          rendered = true;
        }
      } catch (e) {
        console.warn("Engine 1 error:", e);
      }

      // Engine 2: node-qrcode toCanvas fallback
      if (!rendered && window.QRCode && typeof window.QRCode.toCanvas === 'function') {
        try {
          const canvas = document.createElement('canvas');
          window.QRCode.toCanvas(canvas, couponCode, {
            width: 190,
            margin: 1,
            color: { dark: '#004d13', light: '#ffffff' }
          }, function (err) {
            if (!err) {
              container.appendChild(canvas);
              rendered = true;
            }
          });
        } catch (e) {
          console.warn("Engine 2 error:", e);
        }
      }

      // Engine 3: Image API Fallback
      if (!rendered || container.children.length === 0) {
        const img = document.createElement('img');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=${encodeURIComponent(couponCode)}&color=004d13`;
        img.alt = couponCode;
        img.className = 'w-[190px] h-[190px] object-contain rounded-lg';
        container.innerHTML = '';
        container.appendChild(img);
      }
    }

    const modal = document.getElementById('modal-qr-presentation');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  // --------------------------------------------------------------------------
  // 6. Council Scanner Control
  // --------------------------------------------------------------------------
  function startCameraIfPossible() {
    if (window.Html5Qrcode && !qrScannerInstance) {
      try {
        qrScannerInstance = new Html5Qrcode('qr-reader-viewport');
        qrScannerInstance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          (decodedText) => {
            handleScannedCouponCode(decodedText);
          },
          () => {}
        ).catch((err) => {
          console.log("Camera inactive:", err);
        });
      } catch (e) {
        console.warn("Camera skipped:", e);
      }
    }
  }

  function stopCameraIfRunning() {
    if (qrScannerInstance) {
      qrScannerInstance.stop().catch(() => {}).then(() => {
        qrScannerInstance = null;
      });
    }
  }

  async function handleScannedCouponCode(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return;
    if (!supabaseClient) return;

    try {
      const { data, error } = await supabaseClient
        .from('coupons')
        .select('*, students(full_name, room, no), rewards(title)')
        .eq('coupon_code', cleanCode)
        .single();

      if (error || !data) {
        alert('❌ ไม่พบคูปองรหัส ' + cleanCode + ' ในระบบ');
        return;
      }

      if (data.status === 'REDEEMED') {
        alert(`⚠️ คูปองนี้ถูกใช้งานและรับของรางวัลไปแล้วเมื่อ: ${new Date(data.redeemed_at).toLocaleString('th-TH')}`);
        return;
      }

      pendingVerifyCoupon = data;
      document.getElementById('verify-student-name').textContent = data.students?.full_name || 'นักเรียน';
      document.getElementById('verify-student-room').textContent = `ชั้น ${data.students?.room} (เลขที่ ${data.students?.no || '-'})`;
      document.getElementById('verify-reward-title').textContent = data.rewards?.title || 'ของรางวัล';

      const modal = document.getElementById('modal-council-verify');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function confirmHandover() {
    if (!pendingVerifyCoupon || !supabaseClient) return;

    try {
      const { error } = await supabaseClient.rpc('confirm_coupon_handover', {
        p_coupon_code: pendingVerifyCoupon.coupon_code,
        p_council_line_id: activeStudent.student_id
      });

      if (error) {
        await supabaseClient
          .from('coupons')
          .update({
            status: 'REDEEMED',
            redeemed_at: new Date().toISOString(),
            redeemed_by_line_id: activeStudent.student_id
          })
          .eq('coupon_code', pendingVerifyCoupon.coupon_code);
      }

      document.getElementById('modal-council-verify').classList.add('hidden');
      document.getElementById('modal-council-verify').classList.remove('flex');
      
      if (typeof confetti === 'function') {
        confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
      }

      alert('✅ ยืนยันการส่งมอบของรางวัลสำเร็จ! คูปอง ' + pendingVerifyCoupon.coupon_code + ' ถูกตัดสถานะเป็น REDEEMED แล้ว');
      pendingVerifyCoupon = null;
      await fetchRewards();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  // --------------------------------------------------------------------------
  // 7. Super Admin Portal Features (จัดการคะแนน & คูปองทุกคน)
  // --------------------------------------------------------------------------
  function populateAdminRewardDropdown() {
    const select = document.getElementById('adm-add-cpn-reward');
    if (!select) return;
    select.innerHTML = rewardsData.map(r => `
      <option value="${r.reward_id}">${r.title} (${r.points_required} Pts)</option>
    `).join('');
  }

  async function openAdminPortal() {
    const modal = document.getElementById('modal-admin-portal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Default target student to current student
    await searchTargetStudentForAdmin(activeStudent.student_id);
    await fetchAdminLiveCoupons();
  }

  function closeAdminPortal() {
    const modal = document.getElementById('modal-admin-portal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async function searchTargetStudentForAdmin(studentId) {
    const sId = (studentId || '').trim();
    if (!sId) return;

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .eq('student_id', sId)
          .single();

        if (data && !error) {
          adminTargetStudent = data;
          document.getElementById('adm-target-name').textContent = data.full_name;
          document.getElementById('adm-target-meta').textContent = `รหัส: ${data.student_id} | ชั้น ${data.room} (เลขที่ ${data.no || '-'})`;
          document.getElementById('adm-target-points').textContent = `${(data.current_points || 0).toLocaleString()} Pts`;
          document.getElementById('adm-set-points-input').value = data.current_points || 0;
          document.getElementById('adm-add-cpn-std').value = data.student_id;
          return;
        }
      } catch (err) {
        console.warn("Admin search student error:", err);
      }
    }

    alert('❌ ไม่พบนักเรียนรหัส ' + sId);
  }

  async function adjustTargetStudentPoints(delta) {
    if (!adminTargetStudent || !supabaseClient) return;
    const newPoints = Math.max(0, (adminTargetStudent.current_points || 0) + delta);

    try {
      const { error } = await supabaseClient
        .from('students')
        .update({ current_points: newPoints })
        .eq('student_id', adminTargetStudent.student_id);

      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }

      adminTargetStudent.current_points = newPoints;
      document.getElementById('adm-target-points').textContent = `${newPoints.toLocaleString()} Pts`;
      document.getElementById('adm-set-points-input').value = newPoints;

      if (activeStudent && activeStudent.student_id === adminTargetStudent.student_id) {
        await loginStudent(activeStudent.student_id);
      }

      alert(`✅ ปรับแต้มสำเร็จ! แต้มใหม่ของ ${adminTargetStudent.full_name} คือ ${newPoints.toLocaleString()} Pts`);
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function setExactTargetStudentPoints(pointsVal) {
    if (!adminTargetStudent || !supabaseClient) return;
    const newPoints = Math.max(0, parseInt(pointsVal, 10) || 0);

    try {
      const { error } = await supabaseClient
        .from('students')
        .update({ current_points: newPoints })
        .eq('student_id', adminTargetStudent.student_id);

      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }

      adminTargetStudent.current_points = newPoints;
      document.getElementById('adm-target-points').textContent = `${newPoints.toLocaleString()} Pts`;

      if (activeStudent && activeStudent.student_id === adminTargetStudent.student_id) {
        await loginStudent(activeStudent.student_id);
      }

      alert(`✅ บันทึกแต้มสำเร็จ! แต้มใหม่ของ ${adminTargetStudent.full_name} คือ ${newPoints.toLocaleString()} Pts`);
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function adminGenerateCoupon(studentId, rewardId) {
    const sId = (studentId || '').trim();
    if (!sId || !rewardId || !supabaseClient) {
      alert('กรุณากรอกรหัสนักเรียนและเลือกของรางวัล');
      return;
    }

    const uniqueCode = 'CPN-ADM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();

    try {
      const { error } = await supabaseClient
        .from('coupons')
        .insert({
          student_id: sId,
          reward_id: rewardId,
          coupon_code: uniqueCode,
          status: 'ACTIVE'
        });

      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }

      alert(`✅ สร้างคูปองสำเร็จ! รหัสคูปอง: ${uniqueCode} มอบให้นักเรียนรหัส ${sId} เรียบร้อยแล้ว`);
      await fetchAdminLiveCoupons();
      if (activeStudent && activeStudent.student_id === sId) {
        await fetchStudentCoupons();
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function fetchAdminLiveCoupons() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('coupons')
        .select('*, students(full_name, room), rewards(title)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && !error) {
        adminAllCouponsData = data;
        renderAdminCouponsList();
      }
    } catch (e) {
      console.warn("Admin coupons fetch error:", e);
    }
  }

  function renderAdminCouponsList() {
    const listEl = document.getElementById('adm-live-coupons-list');
    if (!listEl) return;

    if (adminAllCouponsData.length === 0) {
      listEl.innerHTML = '<div class="text-center py-4 text-[12px] text-on-surface-variant font-bold">ไม่มีรายการคูปองในระบบ</div>';
      return;
    }

    listEl.innerHTML = adminAllCouponsData.map(c => {
      const isActive = c.status === 'ACTIVE';
      return `
        <div class="bg-surface-container-lowest p-2.5 rounded-[14px] border border-secondary-container flex items-center justify-between gap-2 shadow-xs">
          <div class="truncate">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-primary-container/20 text-primary' : 'bg-surface-variant text-on-surface-variant'}">${c.status}</span>
              <strong class="font-display text-[12px] text-on-surface truncate">${c.rewards?.title || 'ของรางวัล'}</strong>
            </div>
            <p class="text-[10px] text-on-surface-variant font-bold truncate">รหัส: ${c.coupon_code} | นักเรียน: ${c.students?.full_name || c.student_id}</p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button class="btn-adm-toggle-cpn text-[10px] font-bold px-2 py-1 rounded-[8px] bg-secondary-container hover:bg-secondary-container/80 cursor-pointer" data-id="${c.coupon_id}" data-status="${c.status}">
              ${isActive ? 'ตัดใช้แล้ว' : 'รีเซ็ต'}
            </button>
            <button class="btn-adm-delete-cpn text-[10px] font-bold px-2 py-1 rounded-[8px] bg-red-100 text-red-700 hover:bg-red-600 hover:text-white cursor-pointer" data-id="${c.coupon_id}" data-code="${c.coupon_code}">
              ลบ 🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind Action Buttons
    listEl.querySelectorAll('.btn-adm-delete-cpn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cId = btn.getAttribute('data-id');
        const code = btn.getAttribute('data-code');
        if (confirm(`ยืนยันการลบคูปอง ${code} ออกจากระบบถาวรหรือไม่?`)) {
          await adminDeleteCoupon(cId);
        }
      });
    });

    listEl.querySelectorAll('.btn-adm-toggle-cpn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cId = btn.getAttribute('data-id');
        const status = btn.getAttribute('data-status');
        const newStatus = status === 'ACTIVE' ? 'REDEEMED' : 'ACTIVE';
        await adminToggleCouponStatus(cId, newStatus);
      });
    });
  }

  async function adminDeleteCoupon(couponId) {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient
        .from('coupons')
        .delete()
        .eq('coupon_id', couponId);

      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }

      alert('✅ ลบคูปองออกจากระบบเรียบร้อยแล้ว');
      await fetchAdminLiveCoupons();
      if (activeStudent) await fetchStudentCoupons();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function adminToggleCouponStatus(couponId, newStatus) {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient
        .from('coupons')
        .update({
          status: newStatus,
          redeemed_at: newStatus === 'REDEEMED' ? new Date().toISOString() : null
        })
        .eq('coupon_id', couponId);

      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }

      await fetchAdminLiveCoupons();
      if (activeStudent) await fetchStudentCoupons();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  // --------------------------------------------------------------------------
  // 8. Navigation & Event Binding
  // --------------------------------------------------------------------------
  function switchTab(tabId) {
    currentTab = tabId;
    
    // Switch Views
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === tabId);
    });

    // Update Bottom Nav Styling
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isActive);
    });

    // Camera Start/Stop
    if (tabId === 'view-scanner') {
      startCameraIfPossible();
    } else {
      stopCameraIfRunning();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindEvents() {
    // 1. Nav tabs
    document.querySelectorAll('.nav-tab-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });

    // 2. Shortcuts to Profile & Home
    document.getElementById('btn-header-logo')?.addEventListener('click', () => switchTab('tab-home'));
    document.getElementById('btn-header-profile-avatar')?.addEventListener('click', () => switchTab('tab-profile'));
    document.getElementById('btn-quick-to-profile')?.addEventListener('click', () => switchTab('tab-profile'));
    document.getElementById('btn-profile-open-scanner')?.addEventListener('click', () => switchTab('view-scanner'));
    document.getElementById('btn-profile-open-admin')?.addEventListener('click', openAdminPortal);
    document.getElementById('btn-exit-scanner')?.addEventListener('click', () => switchTab('tab-home'));

    // 3. Stat pills on Home
    document.getElementById('btn-stat-pet')?.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(p => {
        const isTarget = p.getAttribute('data-cat') === 'PET';
        p.classList.toggle('active', isTarget);
        p.classList.toggle('bg-primary', isTarget);
        p.classList.toggle('text-on-primary', isTarget);
        p.classList.toggle('bg-surface-container-lowest', !isTarget);
        p.classList.toggle('text-on-surface-variant', !isTarget);
      });
      selectedHomeCategory = 'PET';
      renderHistory();
    });

    document.getElementById('btn-stat-can')?.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(p => {
        const isTarget = p.getAttribute('data-cat') === 'CAN';
        p.classList.toggle('active', isTarget);
        p.classList.toggle('bg-primary', isTarget);
        p.classList.toggle('text-on-primary', isTarget);
        p.classList.toggle('bg-surface-container-lowest', !isTarget);
        p.classList.toggle('text-on-surface-variant', !isTarget);
      });
      selectedHomeCategory = 'CAN';
      renderHistory();
    });

    document.getElementById('btn-stat-room')?.addEventListener('click', () => switchTab('tab-profile'));
    document.getElementById('btn-refresh-history')?.addEventListener('click', async () => {
      await fetchStudentRecycleLogs();
      alert('รีเฟรชประวัติการหยอดขวดเรียบร้อยแล้ว');
    });

    // 4. Home Category pills
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill').forEach(p => {
          p.classList.remove('active', 'bg-primary', 'text-on-primary');
          p.classList.add('bg-surface-container-lowest', 'text-on-surface-variant');
        });
        pill.classList.add('active', 'bg-primary', 'text-on-primary');
        pill.classList.remove('bg-surface-container-lowest', 'text-on-surface-variant');
        selectedHomeCategory = pill.getAttribute('data-cat');
        renderHistory();
      });
    });

    // 5. Store Category filters
    document.querySelectorAll('.store-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.store-filter-pill').forEach(p => {
          p.classList.remove('active', 'bg-primary', 'text-on-primary');
          p.classList.add('bg-surface-container-lowest', 'text-on-surface-variant', 'border', 'border-secondary-container');
        });
        pill.classList.add('active', 'bg-primary', 'text-on-primary');
        pill.classList.remove('bg-surface-container-lowest', 'text-on-surface-variant', 'border', 'border-secondary-container');
        selectedStoreCategory = pill.getAttribute('data-filter');
        renderRewardStore();
      });
    });

    // 6. Coupon subtabs
    document.querySelectorAll('.c-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.c-tab').forEach(b => {
          b.classList.remove('active', 'bg-surface-container-lowest', 'text-primary', 'shadow-sm');
          b.classList.add('text-on-surface-variant');
        });
        btn.classList.add('active', 'bg-surface-container-lowest', 'text-primary', 'shadow-sm');
        btn.classList.remove('text-on-surface-variant');
        renderCoupons();
      });
    });

    // 7. Save Phone (Profile)
    document.getElementById('btn-save-phone').addEventListener('click', async () => {
      const phone = document.getElementById('prof-phone').value.trim();
      if (phone.length < 9) {
        alert('กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง');
        return;
      }
      activeStudent.phone_number = phone;
      if (supabaseClient) {
        await supabaseClient
          .from('students')
          .update({ phone_number: phone })
          .eq('student_id', activeStudent.student_id);
      }
      alert('✅ บันทึกเบอร์โทรศัพท์เรียบร้อยแล้ว');
      renderAll();
    });

    // 8. Gatekeeper Modal Events
    document.getElementById('btn-gatekeeper-cancel')?.addEventListener('click', closeWarningModal);
    document.getElementById('btn-gatekeeper-cancel-backdrop')?.addEventListener('click', closeWarningModal);
    document.getElementById('btn-gatekeeper-save')?.addEventListener('click', async () => {
      const phone = document.getElementById('input-gatekeeper-phone').value.trim();
      if (phone.length < 9) {
        showToast('กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง', 'warning');
        return;
      }
      activeStudent.phone_number = phone;
      if (supabaseClient) {
        await supabaseClient
          .from('students')
          .update({ phone_number: phone })
          .eq('student_id', activeStudent.student_id);
      }
      closeWarningModal();
      if (pendingRedeemReward) {
        executeRedemption(pendingRedeemReward);
        pendingRedeemReward = null;
      }
    });

    // 9. QR Modal close
    document.getElementById('btn-close-qr-modal')?.addEventListener('click', () => {
      document.getElementById('modal-qr-presentation').classList.add('hidden');
      document.getElementById('modal-qr-presentation').classList.remove('flex');
    });
    document.getElementById('btn-close-qr-backdrop')?.addEventListener('click', () => {
      document.getElementById('modal-qr-presentation').classList.add('hidden');
      document.getElementById('modal-qr-presentation').classList.remove('flex');
    });

    // 10. Council Scanner manual input
    document.getElementById('btn-verify-manual')?.addEventListener('click', () => {
      const code = document.getElementById('input-manual-coupon-code').value.trim();
      if (code) handleScannedCouponCode(code);
      else showToast('กรุณากรอกรหัสคูปองก่อนกดตรวจสอบ', 'warning');
    });
    document.getElementById('btn-verify-cancel')?.addEventListener('click', () => {
      document.getElementById('modal-council-verify').classList.add('hidden');
      document.getElementById('modal-council-verify').classList.remove('flex');
      pendingVerifyCoupon = null;
    });
    document.getElementById('btn-verify-confirm')?.addEventListener('click', confirmHandover);

    // 11. LINE Account Binding Events
    document.getElementById('line-bind-student-id')?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val.length === 5) {
        lookupStudentForBinding(val);
      } else {
        document.getElementById('line-bind-preview-box')?.classList.add('hidden');
      }
    });
    document.getElementById('btn-confirm-line-bind')?.addEventListener('click', confirmLineBinding);

    document.getElementById('btn-close-bind-success')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-bind-success');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      showToast(`ยินดีต้อนรับคุณ ${activeStudent?.full_name || ''} 🌿`);
    });
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();
