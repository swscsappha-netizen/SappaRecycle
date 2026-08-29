/**
 * LINE LIFF APPLICATION CONTROLLER
 * Supports:
 * - Student authentication & profile loading
 * - Reward store browsing & redemption
 * - ADR-0001 Phone Number requirement gatekeeper
 * - Dynamic QR Code coupon rendering
 * - Council Admin role detection & camera QR Scanner
 * - Anti-reuse verification & instant stock deduction
 */

(function () {
  'use strict';

  // App State
  let currentTab = 'tab-home';
  let activeStudent = null;
  let activeCouncilUser = null;
  let isCouncilView = false;
  let qrScannerInstance = null;
  let pendingRedeemReward = null;
  let pendingVerifyCoupon = null;

  // Local Mock State (Persisted in localStorage for demo & offline capability)
  let studentsData = new Map();
  let rewardsData = [];
  let couponsData = [];
  let recycleLogsData = [];

  // Default Rewards Catalogue
  const DEFAULT_REWARDS = [
    {
      reward_id: 'rew-1',
      title: 'ปากกาเจลรักษ์โลก (Eco Gel Pen)',
      description: 'ปากกาหมึกเจลสีน้ำเงิน ด้ามทำจากกระดาษรีไซเคิล เขียนลื่น ไม่สะดุด',
      points_required: 30,
      stock_quantity: 150,
      image_url: 'https://images.unsplash.com/photo-1585336261026-7756f7ef0cf4?w=400&q=80'
    },
    {
      reward_id: 'rew-2',
      title: 'สมุดบันทึก Green Earth A5',
      description: 'สมุดโน้ตปกคราฟท์ 80 แผ่น ถนอมสายตา พิมพ์ตราโรงเรียนสรรพวิทยาคม',
      points_required: 50,
      stock_quantity: 80,
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80'
    },
    {
      reward_id: 'rew-3',
      title: 'คูปองอาหารสหกรณ์โรงเรียน 20 บาท',
      description: 'ใช้แลกซื้ออาหารและเครื่องดื่มที่สหกรณ์โรงเรียนสรรพวิทยาคมได้ทันที',
      points_required: 100,
      stock_quantity: 50,
      image_url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=400&q=80'
    },
    {
      reward_id: 'rew-4',
      title: 'กระบอกน้ำสแตนเลส 500ml',
      description: 'กระบอกน้ำสุญญากาศ เก็บความเย็นได้ 12 ชม. สกรีนโลโก้สภานักเรียน',
      points_required: 250,
      stock_quantity: 25,
      image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80'
    },
    {
      reward_id: 'rew-5',
      title: 'ถุงผ้าแคนวาส พับเก็บได้',
      description: 'ถุงผ้าลดโลกร้อน ลายตู้หยอดขวดสรรพวิทยาคม พกพาสะดวก',
      points_required: 120,
      stock_quantity: 40,
      image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80'
    }
  ];

  // --------------------------------------------------------------------------
  // Initialization & Data Loading
  // --------------------------------------------------------------------------
  async function initApp() {
    // 1. Load State from localStorage if available
    loadStoredState();

    // 2. Fetch 2,906 students dataset
    await fetchRosterData();

    // 3. Mock active student login (Default: Student ID 34889 - ชาญนนท์)
    loginAsStudent('34889');

    // 4. Initialize LIFF SDK if in real LINE app
    if (window.liff) {
      try {
        await liff.init({ liffId: "1234567890-AbcdEfgh" });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          console.log("LINE Profile:", profile);
        }
      } catch (err) {
        console.log("Running in standard Web / Local mode (LIFF simulated)");
      }
    }

    renderAll();
    bindEvents();
  }

  function loadStoredState() {
    const storedRewards = localStorage.getItem('swk_rewards');
    rewardsData = storedRewards ? JSON.parse(storedRewards) : [...DEFAULT_REWARDS];

    const storedCoupons = localStorage.getItem('swk_coupons');
    couponsData = storedCoupons ? JSON.parse(storedCoupons) : [];

    const storedLogs = localStorage.getItem('swk_recycle_logs');
    recycleLogsData = storedLogs ? JSON.parse(storedLogs) : [
      { student_id: '34889', item: 'PET', points: 10, time: '29 ส.ค. 09:15' },
      { student_id: '34889', item: 'CAN', points: 20, time: '29 ส.ค. 12:40' },
      { student_id: '34889', item: 'PET', points: 10, time: '29 ส.ค. 15:20' }
    ];
  }

  function saveState() {
    localStorage.setItem('swk_rewards', JSON.stringify(rewardsData));
    localStorage.setItem('swk_coupons', JSON.stringify(couponsData));
    localStorage.setItem('swk_recycle_logs', JSON.stringify(recycleLogsData));
  }

  async function fetchRosterData() {
    try {
      const res = await fetch('../students_all_2906.json');
      if (res.ok) {
        const list = await res.json();
        list.forEach(s => {
          studentsData.set(s.student_id, {
            student_id: s.student_id,
            full_name: s.full_name,
            room: s.room,
            phone_number: s.phone_number || null,
            current_points: s.current_points || 140, // default demo balance
            total_bottles_recycled: s.total_bottles_recycled || 8,
            is_council_member: s.student_id === '34890' // 34890 is council member
          });
        });
      }
    } catch (e) {
      console.warn('Could not fetch JSON roster, using default student');
      studentsData.set('34889', {
        student_id: '34889',
        full_name: 'เด็กชายชาญนนท์ -',
        room: 'ม.1/1',
        phone_number: '0812345678',
        current_points: 140,
        total_bottles_recycled: 8,
        is_council_member: false
      });
      studentsData.set('34890', {
        student_id: '34890',
        full_name: 'เด็กชายณัฐชนน อรรถศิริ',
        room: 'ม.1/1',
        phone_number: '0899999999',
        current_points: 260,
        total_bottles_recycled: 15,
        is_council_member: true
      });
    }
  }

  function loginAsStudent(studentId) {
    activeStudent = studentsData.get(studentId) || {
      student_id: studentId,
      full_name: 'นักเรียนสรรพวิทยาคม',
      room: 'ม.1/1',
      phone_number: null,
      current_points: 140,
      total_bottles_recycled: 8,
      is_council_member: false
    };

    // Council admin toggle button visibility
    const btnToggleScanner = document.getElementById('btn-toggle-scanner-view');
    if (activeStudent.is_council_member || studentId === '34890') {
      btnToggleScanner.style.display = 'flex';
    } else {
      btnToggleScanner.style.display = 'none';
    }
  }

  // --------------------------------------------------------------------------
  // UI Renderers
  // --------------------------------------------------------------------------
  function renderAll() {
    renderHeader();
    renderDashboard();
    renderRewardStore();
    renderCoupons();
    renderProfile();
    lucide.createIcons();
  }

  function renderHeader() {
    document.getElementById('header-user-name').textContent = activeStudent.full_name;
    document.getElementById('header-role-badge').textContent = activeStudent.is_council_member 
      ? '★ กรรมการสภานักเรียน' 
      : 'นักเรียน (' + activeStudent.room + ')';
  }

  function renderDashboard() {
    document.getElementById('dash-student-id').textContent = `รหัส ${activeStudent.student_id}`;
    document.getElementById('dash-points-balance').textContent = activeStudent.current_points;
    document.getElementById('dash-total-bottles').textContent = activeStudent.total_bottles_recycled;
    document.getElementById('dash-student-room').textContent = `ชั้น ${activeStudent.room}`;

    // Render Recent logs
    const listEl = document.getElementById('recent-history-list');
    const myLogs = recycleLogsData.filter(l => l.student_id === activeStudent.student_id);
    if (myLogs.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i data-lucide="inbox"></i>
          <p>ยังไม่มีประวัติการหยอดขวด</p>
        </div>`;
    } else {
      listEl.innerHTML = myLogs.slice(-5).reverse().map(log => `
        <div class="history-item">
          <div class="history-item-left">
            <div class="history-icon ${log.item.toLowerCase()}">
              <i data-lucide="${log.item === 'PET' ? 'cylinder' : 'box'}"></i>
            </div>
            <div class="history-meta">
              <h4>${log.item === 'PET' ? 'ขวดพลาสติกใส PET' : 'กระป๋องอะลูมิเนียม'}</h4>
              <p>${log.time || 'วันนี้'}</p>
            </div>
          </div>
          <span class="history-pts">+${log.points} แต้ม</span>
        </div>
      `).join('');
    }
  }

  function renderRewardStore() {
    const grid = document.getElementById('rewards-grid');
    grid.innerHTML = rewardsData.map(r => {
      const canAfford = activeStudent.current_points >= r.points_required;
      const inStock = r.stock_quantity > 0;
      return `
        <div class="reward-card">
          <div class="reward-img-wrapper">
            <img src="${r.image_url}" alt="${r.title}">
          </div>
          <div class="reward-details">
            <div class="reward-title-row">
              <h3>${r.title}</h3>
              <p class="reward-desc">${r.description}</p>
            </div>
            <div class="reward-footer">
              <div class="reward-cost">
                <span class="cost-num">${r.points_required}</span>
                <span class="cost-unit">แต้ม</span>
                <span class="stock-tag">(คงเหลือ ${r.stock_quantity} ชิ้น)</span>
              </div>
              <button class="btn-redeem" data-reward-id="${r.reward_id}" ${(!canAfford || !inStock) ? 'disabled' : ''}>
                ${!inStock ? 'หมด' : !canAfford ? 'แต้มไม่พอ' : 'แลกรางวัล'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind redeem buttons
    grid.querySelectorAll('.btn-redeem').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rId = e.target.getAttribute('data-reward-id');
        attemptRedeemReward(rId);
      });
    });
  }

  function renderCoupons() {
    const myCoupons = couponsData.filter(c => c.student_id === activeStudent.student_id);
    const activeCoupons = myCoupons.filter(c => c.status === 'ACTIVE');
    const usedCoupons = myCoupons.filter(c => c.status === 'REDEEMED');

    document.getElementById('count-active-coupons').textContent = activeCoupons.length;
    document.getElementById('count-used-coupons').textContent = usedCoupons.length;

    const listEl = document.getElementById('coupons-list');
    const activeFilter = document.querySelector('.coupon-subtab.active')?.getAttribute('data-filter') || 'ACTIVE';
    const displayList = activeFilter === 'ACTIVE' ? activeCoupons : usedCoupons;

    if (displayList.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i data-lucide="ticket"></i>
          <p>ไม่มีคูปองในหมวดนี้</p>
        </div>`;
    } else {
      listEl.innerHTML = displayList.map(c => `
        <div class="coupon-card" data-code="${c.coupon_code}">
          <div class="coupon-top">
            <h3>${c.reward_title}</h3>
            <span class="coupon-status-badge ${c.status.toLowerCase()}">
              ${c.status === 'ACTIVE' ? 'พร้อมใช้ (ไม่มีวันหมดอายุ)' : 'รับของแล้ว'}
            </span>
          </div>
          <div class="coupon-middle">
            <span>รหัส: ${c.coupon_code}</span>
            <div class="btn-show-qr">
              <i data-lucide="qr-code"></i> แสดง QR
            </div>
          </div>
        </div>
      `).join('');

      listEl.querySelectorAll('.coupon-card').forEach(card => {
        card.addEventListener('click', () => {
          const code = card.getAttribute('data-code');
          showCouponQRModal(code);
        });
      });
    }
  }

  function renderProfile() {
    document.getElementById('prof-name').value = activeStudent.full_name;
    document.getElementById('prof-student-id').value = activeStudent.student_id;
    document.getElementById('prof-room').value = activeStudent.room;
    document.getElementById('prof-phone').value = activeStudent.phone_number || '';
  }

  // --------------------------------------------------------------------------
  // Redemption Logic & ADR-0001 Gatekeeper
  // --------------------------------------------------------------------------
  function attemptRedeemReward(rewardId) {
    const reward = rewardsData.find(r => r.reward_id === rewardId);
    if (!reward) return;

    // Check ADR-0001 Phone Number Requirement
    if (!activeStudent.phone_number || activeStudent.phone_number.trim() === '') {
      pendingRedeemReward = reward;
      document.getElementById('modal-phone-required').style.display = 'flex';
      return;
    }

    executeRedemption(reward);
  }

  function executeRedemption(reward) {
    if (activeStudent.current_points < reward.points_required) {
      alert('แต้มสะสมไม่เพียงพอ');
      return;
    }
    if (reward.stock_quantity <= 0) {
      alert('ของรางวัลหมดแล้ว');
      return;
    }

    // Atomic Deduct points & stock
    activeStudent.current_points -= reward.points_required;
    reward.stock_quantity -= 1;

    // Generate unique Dynamic QR code
    const uniqueToken = 'CPN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCoupon = {
      coupon_id: 'cpn-' + Date.now(),
      student_id: activeStudent.student_id,
      student_name: activeStudent.full_name,
      student_room: activeStudent.room,
      reward_id: reward.reward_id,
      reward_title: reward.title,
      coupon_code: uniqueToken,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    couponsData.push(newCoupon);
    saveState();
    renderAll();

    // Celebration & Open QR Modal
    if (typeof confetti === 'function') {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    }
    showCouponQRModal(uniqueToken);
  }

  function showCouponQRModal(couponCode) {
    const coupon = couponsData.find(c => c.coupon_code === couponCode);
    if (!coupon) return;

    document.getElementById('modal-qr-title').textContent = coupon.reward_title;
    document.getElementById('modal-qr-code-text').textContent = coupon.coupon_code;

    // Render Canvas QR
    const canvas = document.getElementById('qr-canvas');
    if (window.QRCode) {
      QRCode.toCanvas(canvas, coupon.coupon_code, {
        width: 180,
        margin: 1,
        color: { dark: '#0a1118', light: '#ffffff' }
      });
    }

    document.getElementById('modal-qr-presentation').style.display = 'flex';
    lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // Council Scanner Controller (Ticket 06)
  // --------------------------------------------------------------------------
  function openScannerView() {
    isCouncilView = true;
    switchTab('view-scanner');
    document.getElementById('bottom-nav').style.display = 'none';

    // Start camera scanner if Html5Qrcode is loaded
    if (window.Html5Qrcode && !qrScannerInstance) {
      try {
        qrScannerInstance = new Html5Qrcode('qr-reader-viewport');
        qrScannerInstance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            handleScannedCouponCode(decodedText);
          },
          (err) => { /* ignore frame read errors */ }
        ).catch(err => {
          console.warn('Camera scanner not available in browser sandbox (use manual entry)');
        });
      } catch (e) {
        console.warn('QR Scanner init skipped');
      }
    }
  }

  function closeScannerView() {
    isCouncilView = false;
    document.getElementById('bottom-nav').style.display = 'flex';
    if (qrScannerInstance) {
      qrScannerInstance.stop().catch(() => {}).then(() => {
        qrScannerInstance = null;
      });
    }
    switchTab('tab-home');
  }

  function handleScannedCouponCode(code) {
    const coupon = couponsData.find(c => c.coupon_code === code.trim());
    if (!coupon) {
      alert('❌ ไม่พบคูปองนี้ในระบบ (Invalid Coupon Code)');
      return;
    }

    if (coupon.status === 'REDEEMED') {
      alert('⚠️ คูปองนี้ถูกใช้งานและรับของรางวัลไปแล้วเมื่อ: ' + (coupon.redeemed_at || ''));
      return;
    }

    // Open Handover Confirmation Modal
    pendingVerifyCoupon = coupon;
    document.getElementById('verify-student-name').textContent = coupon.student_name || 'นักเรียน';
    document.getElementById('verify-student-room').textContent = coupon.student_room || '-';
    document.getElementById('verify-reward-title').textContent = coupon.reward_title;
    document.getElementById('verify-status-pill').textContent = 'ACTIVE (พร้อมรับของ)';
    document.getElementById('modal-council-verify').style.display = 'flex';
    lucide.createIcons();
  }

  function confirmHandover() {
    if (!pendingVerifyCoupon) return;

    pendingVerifyCoupon.status = 'REDEEMED';
    pendingVerifyCoupon.redeemed_at = new Date().toLocaleString('th-TH');
    pendingVerifyCoupon.redeemed_by = activeStudent.full_name;

    saveState();
    renderAll();

    document.getElementById('modal-council-verify').style.display = 'none';
    alert('✅ บันทึกการส่งมอบของรางวัลสำเร็จ! คูปองถูกตัดสถานะเป็น REDEEMED แล้ว');
    pendingVerifyCoupon = null;
  }

  // --------------------------------------------------------------------------
  // Event Bindings
  // --------------------------------------------------------------------------
  function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === tabId));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
  }

  function bindEvents() {
    // Bottom Nav Tabs
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.getAttribute('data-tab'));
      });
    });

    // Quick Action Buttons
    document.getElementById('btn-quick-store')?.addEventListener('click', () => switchTab('tab-rewards'));
    document.getElementById('btn-quick-coupons')?.addEventListener('click', () => switchTab('tab-coupons'));
    document.getElementById('btn-quick-profile')?.addEventListener('click', () => switchTab('tab-profile'));

    // Coupon subtabs
    document.querySelectorAll('.coupon-subtab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.coupon-subtab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCoupons();
      });
    });

    // Profile Phone Save (ADR-0001)
    document.getElementById('btn-save-phone').addEventListener('click', () => {
      const phone = document.getElementById('prof-phone').value.trim();
      if (phone.length < 9) {
        alert('กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง');
        return;
      }
      activeStudent.phone_number = phone;
      alert('✅ บันทึกเบอร์โทรศัพท์เรียบร้อยแล้ว');
      renderAll();
    });

    // Modal Close
    document.getElementById('btn-close-qr-modal').addEventListener('click', () => {
      document.getElementById('modal-qr-presentation').style.display = 'none';
    });

    // Gatekeeper Phone Save
    document.getElementById('btn-gatekeeper-cancel').addEventListener('click', () => {
      document.getElementById('modal-phone-required').style.display = 'none';
      pendingRedeemReward = null;
    });

    document.getElementById('btn-gatekeeper-save').addEventListener('click', () => {
      const phone = document.getElementById('input-gatekeeper-phone').value.trim();
      if (phone.length < 9) {
        alert('กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง');
        return;
      }
      activeStudent.phone_number = phone;
      document.getElementById('modal-phone-required').style.display = 'none';
      if (pendingRedeemReward) {
        executeRedemption(pendingRedeemReward);
        pendingRedeemReward = null;
      }
    });

    // Council Scanner view toggles
    document.getElementById('btn-toggle-scanner-view').addEventListener('click', openScannerView);
    document.getElementById('btn-exit-scanner').addEventListener('click', closeScannerView);

    // Council Manual verification
    document.getElementById('btn-verify-manual').addEventListener('click', () => {
      const code = document.getElementById('input-manual-coupon-code').value.trim();
      if (code) handleScannedCouponCode(code);
    });

    // Council Handover modal actions
    document.getElementById('btn-verify-cancel').addEventListener('click', () => {
      document.getElementById('modal-council-verify').style.display = 'none';
      pendingVerifyCoupon = null;
    });

    document.getElementById('btn-verify-confirm').addEventListener('click', confirmHandover);
  }

  // Boot
  document.addEventListener('DOMContentLoaded', initApp);
})();
