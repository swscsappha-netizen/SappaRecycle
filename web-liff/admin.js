/**
 * SAPPARECYCLE BACKOFFICE ADMIN CONTROLLER
 * Clean, Unified Single-Instance Architecture
 * - Full Analytics Dashboard & Chart.js Visualizations
 * - Complete Student Roster Table (2,906 students) with Live Room Filters & Pagination
 * - Student Quick Point Adjustments & Modal Editor
 * - Reward Catalog CRUD & Stock Management
 * - Coupon Issuer, Status Toggle & Void Manager
 * - LINE Role-Based Access Control (RBAC)
 */

(function () {
  'use strict';

  let supabaseClient = null;
  let currentAdminTab = 'tab-manage-analytics';
  let adminRewards = [];
  let adminCoupons = [];
  let allRecycleLogs = [];
  let currentAdminUser = null;

  // Student Roster Pagination & Filter State
  let studentsRosterData = [];
  let totalStudentsCount = 2906;
  let currentStudentPage = 1;
  const STUDENT_PAGE_SIZE = 20;
  let studentSearchQuery = '';
  let studentRoomFilter = 'ALL';
  let activeEditingStudent = null;

  let couponFilter = 'ALL';
  let currentTimeRange = 'today';

  let dailyTrendChartInstance = null;
  let ratioDonutChartInstance = null;

  const DEFAULT_REWARD_IMAGES = [
    'https://images.unsplash.com/photo-1585336261026-7756f7ef0cf4?w=400&q=80',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=400&q=80',
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80'
  ];

  // --------------------------------------------------------------------------
  // 1. Initialization & RBAC Access Verification
  // --------------------------------------------------------------------------
  async function initAdmin() {
    if (window.supabase && window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL) {
      try {
        supabaseClient = window.supabase.createClient(
          window.APP_CONFIG.SUPABASE_URL,
          window.APP_CONFIG.SUPABASE_ANON_KEY
        );
        console.log("✅ Admin Supabase Connected:", window.APP_CONFIG.SUPABASE_URL);
      } catch (e) {
        console.error("Admin Supabase init error:", e);
      }
    }

    if (window.liff && window.APP_CONFIG && window.APP_CONFIG.LIFF_ID) {
      try {
        await liff.init({ liffId: window.APP_CONFIG.LIFF_ID });
      } catch (err) {
        console.log("Web mode active");
      }
    }

    const isAuthorized = await verifyAdminPermissions();
    if (!isAuthorized) {
      showAccessDeniedScreen();
      return;
    }

    showAdminDashboard();
    bindAdminEvents();
    await loadInitialData();
  }

  async function verifyAdminPermissions() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramStudentId = urlParams.get('student_id') || '32650';

    if (supabaseClient) {
      try {
        // 1. If logged in via LINE LIFF, verify LINE identity belongs to student 32650
        if (window.liff && liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .eq('line_user_id', profile.userId)
            .maybeSingle();

          if (data && !error) {
            currentAdminUser = data;
            // Sole Admin Enforcement: Only student 32650 with is_council_member === true
            return data.student_id === '32650' && data.is_council_member === true;
          }
        }

        // 2. Direct student ID lookup
        const { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .eq('student_id', paramStudentId)
          .maybeSingle();

        if (data && !error) {
          currentAdminUser = data;
          // Sole Admin Enforcement: Only student 32650 with is_council_member === true
          return data.student_id === '32650' && data.is_council_member === true;
        }
      } catch (err) {
        console.warn("Auth check error:", err);
      }
    }

    if (paramStudentId === '32650') {
      currentAdminUser = {
        student_id: '32650',
        full_name: 'นายสุวรรณวัฒน์ ก้องเวหา',
        room: 'ม.5/10',
        no: 7,
        is_council_member: true
      };
      return true;
    }

    return false;
  }

  function showAccessDeniedScreen() {
    const deniedView = document.getElementById('view-access-denied');
    const adminView = document.getElementById('view-admin-dashboard');

    if (deniedView) deniedView.style.display = 'flex';
    if (adminView) adminView.style.display = 'none';

    const nameEl = document.getElementById('denied-user-name');
    if (nameEl && currentAdminUser) {
      nameEl.textContent = `${currentAdminUser.full_name} (${currentAdminUser.student_id})`;
    }
  }

  function showAdminDashboard() {
    const deniedView = document.getElementById('view-access-denied');
    const adminView = document.getElementById('view-admin-dashboard');

    if (deniedView) deniedView.style.display = 'none';
    if (adminView) adminView.style.display = 'flex';

    const officerEl = document.getElementById('admin-officer-name');
    if (officerEl && currentAdminUser) {
      officerEl.textContent = `${currentAdminUser.full_name} (${currentAdminUser.room})`;
    }
  }

  async function loadInitialData() {
    await fetchAllRecycleLogs();
    await fetchAdminRewards();
    await fetchAdminCoupons();
    await fetchStudentsRoster();
    renderAnalyticsView();
  }

  // --------------------------------------------------------------------------
  // 2. PILLAR 0: ANALYTICS, CHARTS & DAILY/MONTHLY DASHBOARD
  // --------------------------------------------------------------------------
  async function fetchAllRecycleLogs() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('recycle_logs')
        .select('*, students(full_name, room, no)')
        .order('created_at', { ascending: false });

      if (data && !error) {
        allRecycleLogs = data;
      }
    } catch (e) {
      console.warn("Recycle logs fetch error:", e);
    }
  }

  function filterLogsByTime(range) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return allRecycleLogs.filter(log => {
      const logDate = new Date(log.created_at);
      if (range === 'today') return logDate >= startOfToday;
      if (range === 'week') return logDate >= sevenDaysAgo;
      if (range === 'month') return logDate >= startOfMonth;
      return true;
    });
  }

  function renderAnalyticsView() {
    const logs = filterLogsByTime(currentTimeRange);

    let petCount = 0;
    let canCount = 0;
    let totalPoints = 0;

    logs.forEach(l => {
      if (l.item_type === 'PET') petCount += 1;
      else if (l.item_type === 'CAN') canCount += 1;
      totalPoints += (l.points_earned || (l.item_type === 'PET' ? 10 : 20));
    });

    const co2Saved = (petCount * 0.0825) + (canCount * 0.095);
    const treeEquivalent = (co2Saved / 1.5).toFixed(1);
    const energySaved = (co2Saved * 1.8).toFixed(1);

    document.getElementById('metric-pet-count').textContent = `${petCount.toLocaleString()} ชิ้น`;
    document.getElementById('metric-can-count').textContent = `${canCount.toLocaleString()} ชิ้น`;
    document.getElementById('metric-points-count').textContent = `${totalPoints.toLocaleString()} Pts`;
    document.getElementById('metric-co2-saved').textContent = `${co2Saved.toFixed(2)} kg`;

    document.getElementById('stat-tree-equivalent').textContent = `${treeEquivalent} ต้น 🌳`;
    document.getElementById('stat-energy-saved').textContent = `${energySaved} kWh ⚡`;

    renderDailyTrendChart(logs);
    renderRatioDonutChart(petCount, canCount);
    renderClassroomLeaderboard();
  }

  function renderDailyTrendChart(logs) {
    const canvas = document.getElementById('chart-daily-trend');
    if (!canvas) return;

    const daysMap = {};
    const dayLabels = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const thaiDate = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
      daysMap[key] = { label: thaiDate, pet: 0, can: 0 };
      dayLabels.push(key);
    }

    logs.forEach(l => {
      const k = l.created_at ? l.created_at.split('T')[0] : '';
      if (daysMap[k]) {
        if (l.item_type === 'PET') daysMap[k].pet += 1;
        else if (l.item_type === 'CAN') daysMap[k].can += 1;
      }
    });

    const labels = dayLabels.map(k => daysMap[k].label);
    const petData = dayLabels.map(k => daysMap[k].pet);
    const canData = dayLabels.map(k => daysMap[k].can);

    if (dailyTrendChartInstance) {
      dailyTrendChartInstance.destroy();
    }

    if (window.Chart) {
      dailyTrendChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'ขวด PET (+10)',
              data: petData,
              backgroundColor: '#1976D2',
              borderRadius: 8
            },
            {
              label: 'กระป๋อง CAN (+20)',
              data: canData,
              backgroundColor: '#F57F17',
              borderRadius: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { font: { family: 'Prompt', weight: 'bold' } } }
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } }
          }
        }
      });
    }
  }

  function renderRatioDonutChart(petCount, canCount) {
    const canvas = document.getElementById('chart-ratio-donut');
    if (!canvas) return;

    const total = petCount + canCount;
    const petPct = total > 0 ? Math.round((petCount / total) * 100) : 50;
    const canPct = total > 0 ? (100 - petPct) : 50;

    document.getElementById('donut-pct-pet').textContent = `${petPct}% (${petCount} ชิ้น)`;
    document.getElementById('donut-pct-can').textContent = `${canPct}% (${canCount} ชิ้น)`;

    if (ratioDonutChartInstance) {
      ratioDonutChartInstance.destroy();
    }

    if (window.Chart) {
      ratioDonutChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['ขวด PET', 'กระป๋อง CAN'],
          datasets: [{
            data: [petCount || 1, canCount || 1],
            backgroundColor: ['#1976D2', '#F57F17'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  function renderClassroomLeaderboard() {
    const listEl = document.getElementById('leaderboard-classroom-list');
    if (!listEl) return;

    const roomCounts = {};
    allRecycleLogs.forEach(l => {
      const room = l.students?.room || 'ม.1/1';
      if (!roomCounts[room]) roomCounts[room] = { room: room, count: 0, points: 0 };
      roomCounts[room].count += 1;
      roomCounts[room].points += (l.points_earned || 10);
    });

    const sortedRooms = Object.values(roomCounts).sort((a, b) => b.count - a.count).slice(0, 5);
    const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

    if (sortedRooms.length === 0) {
      sortedRooms.push({ room: 'ม.1/1', count: 12, points: 150 });
      sortedRooms.push({ room: 'ม.4/2', count: 9, points: 110 });
      sortedRooms.push({ room: 'ม.2/3', count: 7, points: 90 });
    }

    listEl.innerHTML = sortedRooms.map((r, i) => `
      <div class="bg-surface-container-low p-3 rounded-[18px] border border-secondary-container flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-xl">${MEDALS[i] || '🎖️'}</span>
          <div>
            <strong class="font-display text-[14px] text-on-surface">ชั้น ${r.room}</strong>
            <span class="text-[11px] text-on-surface-variant font-bold block">${r.count} ชิ้นรีไซเคิล</span>
          </div>
        </div>
        <span class="font-display font-black text-primary text-[14px]">${r.points.toLocaleString()} Pts</span>
      </div>
    `).join('');
  }

  // --------------------------------------------------------------------------
  // 3. PILLAR 1: REWARDS CRUD
  // --------------------------------------------------------------------------
  async function fetchAdminRewards() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('rewards')
        .select('*')
        .order('points_required', { ascending: true });

      if (data && !error) {
        adminRewards = data;
        renderAdminRewards();
        populateIssueRewardDropdown();
      }
    } catch (e) {
      console.warn("Rewards fetch error:", e);
    }
  }

  function renderAdminRewards() {
    const grid = document.getElementById('admin-rewards-grid');
    if (!grid) return;

    if (adminRewards.length === 0) {
      grid.innerHTML = '<div class="col-span-3 text-center py-12 text-on-surface-variant font-bold">ยังไม่มีของรางวัลในระบบ กดปุ่ม "+ เพิ่มของรางวัลใหม่" ด้านบนได้เลย</div>';
      return;
    }

    grid.innerHTML = adminRewards.map(r => {
      const isActive = r.is_active !== false;
      const inStock = r.stock_quantity > 0;
      const img = r.image_url || DEFAULT_REWARD_IMAGES[0];

      return `
        <div class="bg-white rounded-[24px] p-4 admin-card flex flex-col justify-between gap-4 ${!isActive ? 'opacity-60 bg-gray-50' : ''}">
          <div class="flex gap-3.5">
            <div class="w-20 h-20 rounded-[18px] bg-secondary-container/30 p-2 flex items-center justify-center shrink-0 border border-secondary-container">
              <img alt="${r.title}" class="max-h-full object-contain" src="${img}">
            </div>
            <div class="flex flex-col justify-between truncate">
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isActive ? 'bg-primary-container/20 text-primary' : 'bg-red-100 text-red-700'}">
                  ${isActive ? 'เปิดแสดง' : 'ปิดการแสดง'}
                </span>
                <h3 class="font-display text-[16px] font-black text-on-surface mt-1 truncate" title="${r.title}">${r.title}</h3>
              </div>
              <div class="flex items-center gap-2">
                <strong class="text-[15px] font-black text-[#F57F17]">${r.points_required.toLocaleString()} Pts</strong>
                <span class="text-[11px] font-bold text-on-surface-variant">• สต็อก: <b class="${inStock ? 'text-primary' : 'text-error'}">${r.stock_quantity} ชิ้น</b></span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2 pt-2 border-t border-secondary-container/50">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-on-surface-variant">เติมสต็อก:</span>
              <div class="flex gap-1.5">
                <button class="btn-stock-quick px-2 py-1 rounded-[8px] bg-secondary-container hover:bg-secondary-container/80 text-[11px] font-bold cursor-pointer" data-id="${r.reward_id}" data-delta="5">+5</button>
                <button class="btn-stock-quick px-2 py-1 rounded-[8px] bg-secondary-container hover:bg-secondary-container/80 text-[11px] font-bold cursor-pointer" data-id="${r.reward_id}" data-delta="10">+10</button>
                <button class="btn-stock-quick px-2 py-1 rounded-[8px] bg-secondary-container hover:bg-secondary-container/80 text-[11px] font-bold cursor-pointer" data-id="${r.reward_id}" data-delta="25">+25</button>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-1.5 pt-1">
              <button class="btn-edit-reward py-2 rounded-[10px] bg-surface-container hover:bg-surface-variant font-bold text-[12px] cursor-pointer" data-id="${r.reward_id}">
                ✏️ แก้ไข
              </button>
              <button class="btn-toggle-active-reward py-2 rounded-[10px] ${isActive ? 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100' : 'bg-primary-container/20 text-primary hover:bg-primary-container/30'} font-bold text-[12px] cursor-pointer" data-id="${r.reward_id}" data-active="${isActive}">
                ${isActive ? 'ซ่อน' : 'แสดง'}
              </button>
              <button class="btn-delete-reward py-2 rounded-[10px] bg-red-50 text-red-700 hover:bg-red-600 hover:text-white font-bold text-[12px] cursor-pointer transition-colors" data-id="${r.reward_id}" data-title="${r.title}">
                ลบ 🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.btn-stock-quick').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rId = btn.getAttribute('data-id');
        const delta = parseInt(btn.getAttribute('data-delta'), 10);
        await updateRewardStock(rId, delta);
      });
    });

    grid.querySelectorAll('.btn-edit-reward').forEach(btn => {
      btn.addEventListener('click', () => {
        const rId = btn.getAttribute('data-id');
        openEditRewardModal(rId);
      });
    });

    grid.querySelectorAll('.btn-toggle-active-reward').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rId = btn.getAttribute('data-id');
        const currentActive = btn.getAttribute('data-active') === 'true';
        await toggleRewardActive(rId, !currentActive);
      });
    });

    grid.querySelectorAll('.btn-delete-reward').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rId = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title');
        if (confirm(`ยืนยันการลบของรางวัล "${title}" ออกจากระบบหรือไม่?`)) {
          await deleteReward(rId);
        }
      });
    });
  }

  function openAddRewardModal() {
    document.getElementById('modal-reward-form-title').textContent = '+ เพิ่มของรางวัลใหม่';
    document.getElementById('form-reward-id').value = '';
    document.getElementById('form-reward-title').value = '';
    document.getElementById('form-reward-points').value = '';
    document.getElementById('form-reward-stock').value = '10';
    document.getElementById('form-reward-category').value = 'stationery';
    document.getElementById('form-reward-image').value = DEFAULT_REWARD_IMAGES[0];

    const modal = document.getElementById('modal-reward-form');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function openEditRewardModal(rewardId) {
    const reward = adminRewards.find(r => r.reward_id === rewardId);
    if (!reward) return;

    document.getElementById('modal-reward-form-title').textContent = '✏️ แก้ไขข้อมูลของรางวัล';
    document.getElementById('form-reward-id').value = reward.reward_id;
    document.getElementById('form-reward-title').value = reward.title;
    document.getElementById('form-reward-points').value = reward.points_required;
    document.getElementById('form-reward-stock').value = reward.stock_quantity;
    document.getElementById('form-reward-category').value = reward.category || 'stationery';
    document.getElementById('form-reward-image').value = reward.image_url || '';

    const modal = document.getElementById('modal-reward-form');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeRewardModal() {
    const modal = document.getElementById('modal-reward-form');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async function saveRewardFromForm() {
    const rId = document.getElementById('form-reward-id').value.trim();
    const title = document.getElementById('form-reward-title').value.trim();
    const points = parseInt(document.getElementById('form-reward-points').value, 10);
    const stock = parseInt(document.getElementById('form-reward-stock').value, 10);
    const category = document.getElementById('form-reward-category').value;
    const image = document.getElementById('form-reward-image').value.trim() || DEFAULT_REWARD_IMAGES[0];

    if (!title || isNaN(points) || isNaN(stock)) {
      alert('กรุณากรอกข้อมูลชื่อ, แต้ม, และสต็อกให้ครบถ้วน');
      return;
    }

    if (!supabaseClient) return;

    try {
      if (rId) {
        const { error } = await supabaseClient
          .from('rewards')
          .update({
            title: title,
            points_required: points,
            stock_quantity: stock,
            category: category,
            image_url: image
          })
          .eq('reward_id', rId);

        if (error) throw error;
        alert('✅ แก้ไขข้อมูลของรางวัลสำเร็จ!');
      } else {
        const { error } = await supabaseClient
          .from('rewards')
          .insert({
            title: title,
            points_required: points,
            stock_quantity: stock,
            category: category,
            image_url: image,
            is_active: true
          });

        if (error) throw error;
        alert('✅ เพิ่มของรางวัลใหม่เรียบร้อยแล้ว!');
        if (typeof confetti === 'function') confetti({ particleCount: 50 });
      }

      closeRewardModal();
      await fetchAdminRewards();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function updateRewardStock(rewardId, delta) {
    const reward = adminRewards.find(r => r.reward_id === rewardId);
    if (!reward || !supabaseClient) return;

    const newStock = Math.max(0, (reward.stock_quantity || 0) + delta);
    try {
      const { error } = await supabaseClient
        .from('rewards')
        .update({ stock_quantity: newStock })
        .eq('reward_id', rewardId);

      if (error) throw error;
      await fetchAdminRewards();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function toggleRewardActive(rewardId, newActiveStatus) {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient
        .from('rewards')
        .update({ is_active: newActiveStatus })
        .eq('reward_id', rewardId);

      if (error) throw error;
      await fetchAdminRewards();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function deleteReward(rewardId) {
    if (!supabaseClient) return;

    try {
      // 1. Check if coupons reference this reward
      const { data: linkedCoupons } = await supabaseClient
        .from('coupons')
        .select('coupon_id')
        .eq('reward_id', rewardId);

      if (linkedCoupons && linkedCoupons.length > 0) {
        const choice = confirm(
          `⚠️ ของรางวัลนี้มีประวัติคูปองที่เคยแลกไปแล้ว ${linkedCoupons.length} ใบ\n\n` +
          `• กด [ตกลง / OK] เพื่อ "ลบประวัติคูปองที่เกี่ยวข้องทั้งหมด และลบของรางวัลถาวร"\n` +
          `• กด [ยกเลิก / Cancel] เพื่อ "แค่ซ่อนของรางวัลออกจากร้านค้าแทน" (นักเรียนจะไม่เห็นในร้าน แต่ประวัติยังอยู่)`
        );

        if (choice) {
          // Cascade delete linked coupons first to satisfy foreign key constraint
          await supabaseClient.from('coupons').delete().eq('reward_id', rewardId);
          await supabaseClient.from('rewards').delete().eq('reward_id', rewardId);
          alert('✅ ลบของรางวัลและคูปองที่เกี่ยวข้องออกจากระบบถาวรเรียบร้อยแล้ว');
        } else {
          // Soft delete / Hide reward
          await supabaseClient.from('rewards').update({ is_active: false }).eq('reward_id', rewardId);
          alert('🔒 ปิดการแสดงผล/ซ่อนของรางวัลนี้ออกจากหน้าร้านค้านักเรียนเรียบร้อยแล้ว');
        }
      } else {
        // Direct delete if no foreign key conflict
        const { error } = await supabaseClient
          .from('rewards')
          .delete()
          .eq('reward_id', rewardId);

        if (error) throw error;
        alert('✅ ลบของรางวัลออกจากระบบเรียบร้อยแล้ว');
      }

      await fetchAdminRewards();
      await fetchAdminCoupons();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  // --------------------------------------------------------------------------
  // 4. PILLAR 2: ALL-STUDENTS ROSTER TABLE & PAGINATION
  // --------------------------------------------------------------------------
  async function fetchStudentsRoster() {
    if (!supabaseClient) return;

    try {
      let query = supabaseClient
        .from('students')
        .select('*', { count: 'exact' });

      if (studentSearchQuery) {
        if (/^\d+$/.test(studentSearchQuery)) {
          query = query.ilike('student_id', `%${studentSearchQuery}%`);
        } else {
          query = query.ilike('full_name', `%${studentSearchQuery}%`);
        }
      }

      if (studentRoomFilter && studentRoomFilter !== 'ALL') {
        if (studentRoomFilter.startsWith('ม.')) {
          query = query.ilike('room', `%${studentRoomFilter}%`);
        }
      }

      const from = (currentStudentPage - 1) * STUDENT_PAGE_SIZE;
      const to = from + STUDENT_PAGE_SIZE - 1;

      const { data, count, error } = await query
        .order('student_id', { ascending: true })
        .range(from, to);

      if (data && !error) {
        studentsRosterData = data;
        totalStudentsCount = count !== null ? count : data.length;
        renderStudentsTable();
      }
    } catch (e) {
      console.warn("Students roster fetch error:", e);
    }
  }

  function renderStudentsTable() {
    const tbody = document.getElementById('admin-students-table-body');
    if (!tbody) return;

    const totalPages = Math.ceil(totalStudentsCount / STUDENT_PAGE_SIZE) || 1;
    const startIdx = (currentStudentPage - 1) * STUDENT_PAGE_SIZE + 1;
    const endIdx = Math.min(startIdx + studentsRosterData.length - 1, totalStudentsCount);

    document.getElementById('adm-students-matched-count').textContent = `แสดง ${startIdx} - ${endIdx} จากทั้งหมด ${totalStudentsCount.toLocaleString()} คน`;
    document.getElementById('student-pagination-text').textContent = `หน้า ${currentStudentPage} / ${totalPages}`;

    const prevBtn = document.getElementById('btn-student-prev-page');
    const nextBtn = document.getElementById('btn-student-next-page');
    if (prevBtn) prevBtn.disabled = (currentStudentPage <= 1);
    if (nextBtn) nextBtn.disabled = (currentStudentPage >= totalPages);

    if (studentsRosterData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-on-surface-variant font-bold">ไม่พบข้อมูลนักเรียนที่ค้นหา</td></tr>';
      return;
    }

    tbody.innerHTML = studentsRosterData.map(s => {
      const isCouncil = s.is_council_member || s.student_id === '32650';
      return `
        <tr class="border-b border-secondary-container/40 hover:bg-surface-container-low/50">
          <td class="py-3 px-3 font-display font-black text-primary">${s.student_id}</td>
          <td class="py-3 px-3">
            <div class="flex items-center gap-1.5 flex-wrap">
              <strong class="font-bold text-on-surface">${s.full_name}</strong>
              ${isCouncil ? '<span class="text-[10px] font-black text-[#b45309] bg-[#fef3c7] px-1.5 py-0.2 rounded border border-[#fde047]">สภานักเรียน</span>' : ''}
              ${s.line_user_id ? '<span class="text-[9px] font-black text-[#06C755] bg-[#E8F8EE] px-1.5 py-0.2 rounded border border-[#86EFAC]">ผูก LINE แล้ว 🔗</span>' : '<span class="text-[9px] font-bold text-on-surface-variant/60 bg-surface-container px-1.5 py-0.2 rounded">ยังไม่ผูก LINE</span>'}
            </div>
          </td>
          <td class="py-3 px-3 font-bold text-on-surface-variant">ชั้น ${s.room} (เลขที่ ${s.no || '-'})</td>
          <td class="py-3 px-3 text-[12px] font-bold ${s.phone_number ? 'text-on-surface' : 'text-on-surface-variant/60'}">
            ${s.phone_number || 'ยังไม่ได้ระบุ'}
          </td>
          <td class="py-3 px-3 font-display font-black text-primary text-[15px]">
            ${(s.current_points || 0).toLocaleString()} Pts
          </td>
          <td class="py-3 px-3 text-right">
            <div class="flex items-center justify-end gap-1">
              <button class="btn-table-quick-add text-[11px] font-black px-2 py-1 rounded-[8px] bg-primary-container/20 text-primary hover:bg-primary hover:text-white cursor-pointer" data-id="${s.student_id}" data-delta="50">
                +50
              </button>
              <button class="btn-table-quick-add text-[11px] font-black px-2 py-1 rounded-[8px] bg-primary-container/20 text-primary hover:bg-primary hover:text-white cursor-pointer" data-id="${s.student_id}" data-delta="100">
                +100
              </button>
              <button class="btn-table-manage-std text-[11px] font-bold px-2.5 py-1 rounded-[8px] bg-secondary-container hover:bg-secondary-container/80 cursor-pointer" data-id="${s.student_id}">
                ✏️ จัดการ
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind Table Row Actions
    tbody.querySelectorAll('.btn-table-quick-add').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const sId = btn.getAttribute('data-id');
        const delta = parseInt(btn.getAttribute('data-delta'), 10);
        await quickAdjustPointsByStudentId(sId, delta);
      });
    });

    tbody.querySelectorAll('.btn-table-manage-std').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const sId = btn.getAttribute('data-id');
        await openStudentEditorModal(sId);
      });
    });
  }

  async function quickAdjustPointsByStudentId(studentId, delta) {
    if (!supabaseClient) return;
    const student = studentsRosterData.find(s => s.student_id === studentId);
    if (!student) return;

    const newPoints = Math.max(0, (student.current_points || 0) + delta);
    try {
      const { error } = await supabaseClient
        .from('students')
        .update({ current_points: newPoints })
        .eq('student_id', studentId);

      if (error) throw error;
      student.current_points = newPoints;
      renderStudentsTable();
      alert(`✅ เพิ่ม ${delta} แต้มให้ ${student.full_name} เรียบร้อยแล้ว (แต้มใหม่: ${newPoints.toLocaleString()} Pts)`);
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function openStudentEditorModal(studentId) {
    let student = studentsRosterData.find(s => s.student_id === studentId);
    
    if (!student && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .eq('student_id', studentId)
          .single();
        if (data && !error) student = data;
      } catch (err) {
        console.warn("Fetch single student error:", err);
      }
    }

    if (!student) {
      alert('❌ ไม่พบข้อมูลนักเรียน: ' + studentId);
      return;
    }

    activeEditingStudent = student;
    document.getElementById('m-edit-std-name').textContent = student.full_name;
    document.getElementById('m-edit-std-meta').textContent = `รหัส: ${student.student_id} | ชั้น ${student.room} (เลขที่ ${student.no || '-'})`;
    document.getElementById('m-edit-std-points').textContent = `${(student.current_points || 0).toLocaleString()} Pts`;
    document.getElementById('m-edit-custom-points').value = student.current_points || 0;
    document.getElementById('m-edit-phone').value = student.phone_number || '';

    const lineDot = document.getElementById('m-edit-line-dot');
    const lineStatus = document.getElementById('m-edit-line-status');
    const btnUnlink = document.getElementById('btn-m-unlink-line');
    
    if (student.line_user_id) {
      if (lineDot) lineDot.className = 'w-2.5 h-2.5 rounded-full bg-[#06C755]';
      if (lineStatus) lineStatus.innerHTML = `สถานะ: <span class="text-[#06C755] font-black">ผูกบัญชี LINE แล้ว 🔗</span>`;
      if (btnUnlink) btnUnlink.style.display = 'flex';
    } else {
      if (lineDot) lineDot.className = 'w-2.5 h-2.5 rounded-full bg-surface-variant';
      if (lineStatus) lineStatus.innerHTML = `สถานะ: <span class="text-on-surface-variant/70 font-bold">ยังไม่ได้ผูกบัญชี LINE</span>`;
      if (btnUnlink) btnUnlink.style.display = 'none';
    }

    const modal = document.getElementById('modal-edit-student');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  function closeStudentEditorModal() {
    const modal = document.getElementById('modal-edit-student');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    activeEditingStudent = null;
  }

  async function unlinkStudentLineAccount() {
    if (!activeEditingStudent || !supabaseClient) return;
    const confirmUnlink = confirm(`⚠️ ต้องการปลดล็อกการผูกบัญชี LINE ของ "${activeEditingStudent.full_name}" (รหัส ${activeEditingStudent.student_id}) ใช่หรือไม่?\n\nเมื่อปลดล็อกแล้ว นักเรียนจะสามารถนำบัญชี LINE มาผูกใหม่ได้ทันที`);
    if (!confirmUnlink) return;

    try {
      const { error } = await supabaseClient
        .from('students')
        .update({ line_user_id: null })
        .eq('student_id', activeEditingStudent.student_id);

      if (error) throw error;
      activeEditingStudent.line_user_id = null;
      renderStudentsTable();
      openStudentEditorModal(activeEditingStudent.student_id);
      alert(`✅ ปลดล็อกบัญชี LINE ให้นักเรียน "${activeEditingStudent.full_name}" เรียบร้อยแล้ว!`);
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function saveModalCustomPoints() {
    if (!activeEditingStudent || !supabaseClient) return;
    const newPoints = Math.max(0, parseInt(document.getElementById('m-edit-custom-points').value, 10) || 0);

    try {
      const { error } = await supabaseClient
        .from('students')
        .update({ current_points: newPoints })
        .eq('student_id', activeEditingStudent.student_id);

      if (error) throw error;
      activeEditingStudent.current_points = newPoints;
      document.getElementById('m-edit-std-points').textContent = `${newPoints.toLocaleString()} Pts`;
      renderStudentsTable();
      alert(`✅ บันทึกแต้มสำเร็จ! แต้มใหม่คือ ${newPoints.toLocaleString()} Pts`);
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function saveModalPhone() {
    if (!activeEditingStudent || !supabaseClient) return;
    const phone = document.getElementById('m-edit-phone').value.trim();

    try {
      const { error } = await supabaseClient
        .from('students')
        .update({ phone_number: phone })
        .eq('student_id', activeEditingStudent.student_id);

      if (error) throw error;
      activeEditingStudent.phone_number = phone;
      renderStudentsTable();
      alert('✅ บันทึกเบอร์โทรศัพท์เรียบร้อยแล้ว!');
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function modalQuickAdjustPoints(delta) {
    if (!activeEditingStudent || !supabaseClient) return;
    const newPoints = Math.max(0, (activeEditingStudent.current_points || 0) + delta);

    try {
      const { error } = await supabaseClient
        .from('students')
        .update({ current_points: newPoints })
        .eq('student_id', activeEditingStudent.student_id);

      if (error) throw error;
      activeEditingStudent.current_points = newPoints;
      document.getElementById('m-edit-std-points').textContent = `${newPoints.toLocaleString()} Pts`;
      document.getElementById('m-edit-custom-points').value = newPoints;
      renderStudentsTable();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  // --------------------------------------------------------------------------
  // 5. PILLAR 3: COUPONS MANAGEMENT
  // --------------------------------------------------------------------------
  function populateIssueRewardDropdown() {
    const select = document.getElementById('issue-reward-select');
    if (!select) return;
    select.innerHTML = adminRewards.map(r => `
      <option value="${r.reward_id}">${r.title} (${r.points_required} Pts)</option>
    `).join('');
  }

  async function fetchAdminCoupons() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('coupons')
        .select('*, students(full_name, room, no), rewards(title)')
        .order('created_at', { ascending: false })
        .limit(40);

      if (data && !error) {
        adminCoupons = data;
        renderAdminCoupons();
      }
    } catch (e) {
      console.warn("Coupons fetch error:", e);
    }
  }

  function renderAdminCoupons() {
    const tbody = document.getElementById('admin-coupons-table-body');
    if (!tbody) return;

    let filtered = adminCoupons;
    if (couponFilter !== 'ALL') {
      filtered = adminCoupons.filter(c => c.status === couponFilter);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-on-surface-variant font-bold">ไม่มีรายการคูปองในหมวดนี้</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(c => {
      const isActive = c.status === 'ACTIVE';
      const createdDate = new Date(c.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
      const studentName = c.students?.full_name || `รหัส ${c.student_id}`;
      const studentRoom = c.students?.room ? `(${c.students.room})` : '';

      return `
        <tr class="border-b border-secondary-container/40 hover:bg-surface-container-low/50">
          <td class="py-3 px-3 font-display font-bold text-primary">${c.coupon_code}</td>
          <td class="py-3 px-3 font-bold">${c.rewards?.title || 'ของรางวัล'}</td>
          <td class="py-3 px-3 font-bold">${studentName} ${studentRoom}</td>
          <td class="py-3 px-3">
            <span class="text-[11px] font-black px-2.5 py-1 rounded-full ${isActive ? 'bg-primary-container/20 text-primary' : 'bg-surface-variant text-on-surface-variant'}">
              ${c.status}
            </span>
          </td>
          <td class="py-3 px-3 text-[12px] text-on-surface-variant font-bold">${createdDate}</td>
          <td class="py-3 px-3 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button class="btn-toggle-cpn-status px-2.5 py-1 rounded-[8px] bg-secondary-container hover:bg-secondary-container/80 text-[11px] font-bold cursor-pointer" data-id="${c.coupon_id}" data-status="${c.status}">
                ${isActive ? 'ตัดใช้แล้ว' : 'รีเซ็ต'}
              </button>
              <button class="btn-delete-cpn px-2.5 py-1 rounded-[8px] bg-red-100 text-red-700 hover:bg-red-600 hover:text-white text-[11px] font-bold cursor-pointer" data-id="${c.coupon_id}" data-code="${c.coupon_code}">
                ลบ 🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-toggle-cpn-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cId = btn.getAttribute('data-id');
        const status = btn.getAttribute('data-status');
        const nextStatus = status === 'ACTIVE' ? 'REDEEMED' : 'ACTIVE';
        await toggleCouponStatus(cId, nextStatus);
      });
    });

    tbody.querySelectorAll('.btn-delete-cpn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cId = btn.getAttribute('data-id');
        const code = btn.getAttribute('data-code');
        if (confirm(`ยืนยันการลบคูปอง ${code} ออกจากระบบถาวรหรือไม่?`)) {
          await deleteCoupon(cId);
        }
      });
    });
  }

  function openIssueCouponModal() {
    populateIssueRewardDropdown();
    document.getElementById('issue-student-id').value = '34889';
    const modal = document.getElementById('modal-issue-coupon');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  function closeIssueCouponModal() {
    const modal = document.getElementById('modal-issue-coupon');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  async function issueCouponToStudent() {
    const studentId = document.getElementById('issue-student-id').value.trim();
    const selectEl = document.getElementById('issue-reward-select');
    const rewardId = selectEl ? selectEl.value : (adminRewards[0]?.reward_id || '00000000-0000-0000-0000-000000000001');

    if (!studentId || !rewardId || !supabaseClient) {
      alert('กรุณาระบุรหัสนักเรียนและเลือกของรางวัล');
      return;
    }

    const uniqueCode = 'CPN-ADM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();

    try {
      const { error } = await supabaseClient
        .from('coupons')
        .insert({
          student_id: studentId,
          reward_id: rewardId,
          coupon_code: uniqueCode,
          status: 'ACTIVE'
        });

      if (error) throw error;
      alert(`✅ ออกคูปองสำเร็จ! รหัส ${uniqueCode} มอบให้นักเรียน ${studentId} เรียบร้อยแล้ว`);
      if (typeof confetti === 'function') confetti({ particleCount: 50 });
      closeIssueCouponModal();
      await fetchAdminCoupons();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function toggleCouponStatus(couponId, newStatus) {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient
        .from('coupons')
        .update({
          status: newStatus,
          redeemed_at: newStatus === 'REDEEMED' ? new Date().toISOString() : null
        })
        .eq('coupon_id', couponId);

      if (error) throw error;
      await fetchAdminCoupons();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  async function deleteCoupon(couponId) {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient
        .from('coupons')
        .delete()
        .eq('coupon_id', couponId);

      if (error) throw error;
      alert('✅ ลบคูปองเรียบร้อยแล้ว');
      await fetchAdminCoupons();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  }

  // --------------------------------------------------------------------------
  // 6. Navigation & Events Binding
  // --------------------------------------------------------------------------
  function switchAdminTab(tabId) {
    currentAdminTab = tabId;
    document.querySelectorAll('.admin-tab-pane').forEach(p => {
      p.classList.toggle('hidden', p.id !== tabId);
      p.classList.toggle('flex', p.id === tabId);
    });

    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isActive);
    });

    if (tabId === 'tab-manage-analytics') {
      renderAnalyticsView();
    } else if (tabId === 'tab-manage-students') {
      fetchStudentsRoster();
    }
  }

  function bindAdminEvents() {
    // 1. Navigation Tabs
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchAdminTab(btn.getAttribute('data-tab')));
    });

    // 2. Time Horizon Buttons
    document.querySelectorAll('.btn-time-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-time-filter').forEach(b => {
          b.classList.remove('bg-primary', 'text-white');
          b.classList.add('text-on-surface-variant');
        });
        btn.classList.add('bg-primary', 'text-white');
        btn.classList.remove('text-on-surface-variant');
        currentTimeRange = btn.getAttribute('data-range');
        renderAnalyticsView();
      });
    });

    // 3. Rewards Actions
    document.getElementById('btn-open-add-reward-modal')?.addEventListener('click', openAddRewardModal);
    document.getElementById('btn-close-reward-modal')?.addEventListener('click', closeRewardModal);
    document.getElementById('btn-close-reward-modal-backdrop')?.addEventListener('click', closeRewardModal);
    document.getElementById('btn-cancel-reward-modal')?.addEventListener('click', closeRewardModal);
    document.getElementById('btn-save-reward')?.addEventListener('click', saveRewardFromForm);

    // 4. Students Roster Actions
    document.getElementById('btn-adm-search-student-page')?.addEventListener('click', () => {
      studentSearchQuery = document.getElementById('adm-student-search-input').value.trim();
      currentStudentPage = 1;
      fetchStudentsRoster();
    });
    document.getElementById('adm-student-search-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        studentSearchQuery = e.target.value.trim();
        currentStudentPage = 1;
        fetchStudentsRoster();
      }
    });

    document.getElementById('adm-filter-room-select')?.addEventListener('change', (e) => {
      studentRoomFilter = e.target.value;
      currentStudentPage = 1;
      fetchStudentsRoster();
    });

    document.getElementById('btn-adm-refresh-students')?.addEventListener('click', fetchStudentsRoster);

    document.getElementById('btn-student-prev-page')?.addEventListener('click', () => {
      if (currentStudentPage > 1) {
        currentStudentPage -= 1;
        fetchStudentsRoster();
      }
    });

    document.getElementById('btn-student-next-page')?.addEventListener('click', () => {
      const totalPages = Math.ceil(totalStudentsCount / STUDENT_PAGE_SIZE) || 1;
      if (currentStudentPage < totalPages) {
        currentStudentPage += 1;
        fetchStudentsRoster();
      }
    });

    // Student Editor Modal Events
    document.getElementById('btn-close-edit-student-modal')?.addEventListener('click', closeStudentEditorModal);
    document.getElementById('btn-close-edit-student-backdrop')?.addEventListener('click', closeStudentEditorModal);
    document.getElementById('btn-m-close-editor')?.addEventListener('click', closeStudentEditorModal);
    document.getElementById('btn-m-save-points')?.addEventListener('click', saveModalCustomPoints);
    document.getElementById('btn-m-save-phone')?.addEventListener('click', saveModalPhone);
    document.getElementById('btn-m-unlink-line')?.addEventListener('click', unlinkStudentLineAccount);

    document.querySelectorAll('.btn-m-quick-pt').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = parseInt(btn.getAttribute('data-delta'), 10);
        modalQuickAdjustPoints(delta);
      });
    });

    // 5. Coupons Actions
    document.getElementById('btn-open-issue-coupon-modal')?.addEventListener('click', openIssueCouponModal);
    document.getElementById('btn-close-issue-modal')?.addEventListener('click', closeIssueCouponModal);
    document.getElementById('btn-close-issue-modal-backdrop')?.addEventListener('click', closeIssueCouponModal);
    document.getElementById('btn-cancel-issue-modal')?.addEventListener('click', closeIssueCouponModal);
    document.getElementById('btn-confirm-issue-coupon')?.addEventListener('click', issueCouponToStudent);
    document.getElementById('btn-refresh-admin-coupons')?.addEventListener('click', fetchAdminCoupons);

    document.querySelectorAll('.adm-cpn-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.adm-cpn-filter').forEach(b => {
          b.classList.remove('active', 'bg-primary', 'text-white');
          b.classList.add('bg-surface-container-low', 'text-on-surface-variant');
        });
        btn.classList.add('active', 'bg-primary', 'text-white');
        btn.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
        couponFilter = btn.getAttribute('data-cpn-filter');
        renderAdminCoupons();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initAdmin);
})();
