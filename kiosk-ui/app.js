/**
 * KIOSK APPLICATION CONTROLLER
 * Supports:
 * - 4 Navigation Screens (Welcome -> Numpad ID -> Batch Deposit -> Summary)
 * - 2,906 Student database search
 * - ADR-0001 Progressive Phone Registration (Skip or Save)
 * - Sensor Fusion integration & AI live feedback
 * - Celebration Confetti & Auto Return Countdown
 */

(function () {
  'use strict';

  // State
  let currentScreen = 'screen-welcome';
  let pinInput = '';
  let activeStudent = null;
  let sessionPET = 0;
  let sessionCAN = 0;
  let returnCountdownTimer = null;

  // Local student cache (loaded from JSON if available or fallback dataset)
  let studentDatabase = new Map();

  // Elements
  const screens = {
    welcome: document.getElementById('screen-welcome'),
    numpad: document.getElementById('screen-numpad'),
    deposit: document.getElementById('screen-deposit'),
    summary: document.getElementById('screen-summary')
  };

  const pinDisplay = document.getElementById('pin-display');
  const btnSubmitId = document.getElementById('btn-submit-id');
  const studentPreview = document.getElementById('student-preview');
  const previewName = document.getElementById('preview-name');
  const previewRoom = document.getElementById('preview-room');
  const previewId = document.getElementById('preview-id');

  // Phone Modal (ADR-0001)
  const modalPhone = document.getElementById('modal-phone');
  const inputPhoneModal = document.getElementById('input-phone-modal');
  let phoneModalInput = '';

  // Session stats elements
  const sessionStudentName = document.getElementById('session-student-name');
  const sessionStudentInfo = document.getElementById('session-student-info');
  const sessionPetCount = document.getElementById('session-pet-count');
  const sessionCanCount = document.getElementById('session-can-count');
  const sessionPointsEarned = document.getElementById('session-points-earned');
  const aiBox = document.getElementById('ai-box');
  const aiTag = document.getElementById('ai-tag');
  const sensorStatus = document.getElementById('sensor-status');
  const conveyorOverlay = document.getElementById('conveyor-overlay');
  const conveyorStatusText = document.getElementById('conveyor-status-text');

  // Bin elements
  const petBinVal = document.getElementById('pet-bin-val');
  const canBinVal = document.getElementById('can-bin-val');
  const petBinDot = document.getElementById('pet-bin-dot');
  const canBinDot = document.getElementById('can-bin-dot');
  const binAlertBanner = document.getElementById('bin-alert-banner');
  const binAlertMsg = document.getElementById('bin-alert-msg');

  // Initialize Hardware Simulator
  const simulator = new window.HardwareSimulator(handleHardwareEvent);

  // Load 2,906 students
  async function loadStudentData() {
    try {
      const resp = await fetch('../students_all_2906.json');
      if (resp.ok) {
        const list = await resp.json();
        list.forEach(s => studentDatabase.set(s.student_id, {
          student_id: s.student_id,
          full_name: s.full_name,
          room: s.room,
          phone_number: s.phone_number || null,
          current_points: s.current_points || 0,
          total_bottles: s.total_bottles || 0
        }));
        console.log(`Loaded ${studentDatabase.size} students into Kiosk memory.`);
      }
    } catch (e) {
      console.warn('Local JSON load fallback, seeding basic demo data');
      // Fallback minimal demo
      studentDatabase.set('34889', { student_id: '34889', full_name: 'เด็กชายชาญนนท์ -', room: 'ม.1/1', phone_number: null, current_points: 40 });
      studentDatabase.set('34890', { student_id: '34890', full_name: 'เด็กชายณัฐชนน อรรถศิริ', room: 'ม.1/1', phone_number: '0812345678', current_points: 120 });
    }
  }

  // Screen Switcher
  function showScreen(screenId) {
    currentScreen = screenId;
    Object.keys(screens).forEach(key => {
      screens[key].classList.toggle('active', screens[key].id === screenId);
    });
  }

  // --------------------------------------------------------------------------
  // Hardware Simulator Event Handler
  // --------------------------------------------------------------------------
  function handleHardwareEvent(eventType, payload) {
    console.log(`[HW EVENT] ${eventType}:`, payload);

    if (eventType === 'CONVEYOR_STATE') {
      if (payload.state === 'FORWARD') {
        conveyorStatusText.textContent = 'สายพานกำลังลำเลียงขวดไปจุดตรวจจับ...';
        conveyorOverlay.style.background = 'rgba(14, 165, 233, 0.8)';
      } else if (payload.state === 'REVERSE') {
        conveyorStatusText.textContent = '⚠️ กำลังส่งคืนขยะแปลกปลอม (Reverse)...';
        conveyorOverlay.style.background = 'rgba(239, 68, 68, 0.8)';
      } else {
        conveyorStatusText.textContent = 'สายพานพร้อมทำงาน';
        conveyorOverlay.style.background = 'rgba(0, 0, 0, 0.7)';
      }
    }

    if (eventType === 'AI_INFERENCE') {
      aiBox.style.display = 'flex';
      if (payload.class === 'PET') {
        aiTag.textContent = `ขวดพลาสติกใส PET (${(payload.confidence * 100).toFixed(1)}%)`;
        aiTag.style.background = '#10b981';
      } else if (payload.class === 'CAN') {
        aiTag.textContent = `กระป๋องอะลูมิเนียม CAN (${(payload.confidence * 100).toFixed(1)}%)`;
        aiTag.style.background = '#f59e0b';
      } else {
        aiTag.textContent = `ไม่ใช่วัสดุรีไซเคิล (${(payload.confidence * 100).toFixed(1)}%)`;
        aiTag.style.background = '#ef4444';
      }
    }

    if (eventType === 'ITEM_SORTED') {
      aiBox.style.display = 'none';
      if (payload.item === 'PET') {
        sessionPET++;
        sessionPetCount.textContent = sessionPET;
      } else if (payload.item === 'CAN') {
        sessionCAN++;
        sessionCanCount.textContent = sessionCAN;
      }
      updateSessionPoints();
      triggerMiniConfetti();
    }

    if (eventType === 'ITEM_REJECTED') {
      aiBox.style.display = 'none';
      sensorStatus.innerHTML = '<i data-lucide="alert-triangle"></i> ขยะแปลกปลอม - ส่งคืนแล้ว';
      sensorStatus.style.color = '#ef4444';
      lucide.createIcons();
      setTimeout(() => {
        sensorStatus.innerHTML = '<i data-lucide="activity"></i> พร้อมรับขวด';
        sensorStatus.style.color = '#34d399';
        lucide.createIcons();
      }, 3000);
    }

    if (eventType === 'BIN_LEVEL_UPDATE') {
      petBinVal.textContent = `${payload.petLevel}%`;
      canBinVal.textContent = `${payload.canLevel}%`;

      updateBinDot(petBinDot, payload.petLevel);
      updateBinDot(canBinDot, payload.canLevel);

      if (payload.petLevel >= 90 || payload.canLevel >= 90) {
        binAlertBanner.style.display = 'flex';
        binAlertMsg.textContent = 'แจ้งเตือน: ถังขยะใกล้เต็ม กรุณาติดต่อคุณครู/เจ้าหน้าที่ประจำจุด';
      } else {
        binAlertBanner.style.display = 'none';
      }
    }
  }

  function updateBinDot(dotElem, level) {
    dotElem.className = 'bin-dot ' + (level >= 90 ? 'danger' : level >= 75 ? 'warning' : 'normal');
  }

  function updateSessionPoints() {
    const totalPts = (sessionPET * 10) + (sessionCAN * 20);
    sessionPointsEarned.innerHTML = `${totalPts} <small>แต้ม</small>`;
  }

  function triggerMiniConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }

  // --------------------------------------------------------------------------
  // Numpad & Identification (Ticket 02)
  // --------------------------------------------------------------------------
  function updatePinDisplay() {
    let text = '';
    for (let i = 0; i < 5; i++) {
      text += (i < pinInput.length ? pinInput[i] : '_') + ' ';
    }
    pinDisplay.textContent = text.trim();

    if (pinInput.length === 5) {
      const student = studentDatabase.get(pinInput);
      if (student) {
        activeStudent = student;
        previewName.textContent = student.full_name;
        previewRoom.textContent = `ชั้น ${student.room} | รหัส ${student.student_id}`;
        studentPreview.style.display = 'flex';
        btnSubmitId.disabled = false;
      } else {
        activeStudent = { student_id: pinInput, full_name: 'นักเรียนทั่วไป', room: 'ม.1/1', current_points: 0 };
        previewName.textContent = 'นักเรียนใหม่ (ไม่พบในสารบบ)';
        previewRoom.textContent = `รหัส ${pinInput}`;
        studentPreview.style.display = 'flex';
        btnSubmitId.disabled = false;
      }
    } else {
      activeStudent = null;
      studentPreview.style.display = 'none';
      btnSubmitId.disabled = true;
    }
  }

  // --------------------------------------------------------------------------
  // Progressive Phone Modal (ADR-0001)
  // --------------------------------------------------------------------------
  function checkPhoneAndProceed() {
    if (!activeStudent) return;

    if (!activeStudent.phone_number || activeStudent.phone_number.trim() === '') {
      // Show ADR-0001 Phone Modal with Skip
      phoneModalInput = '';
      inputPhoneModal.value = '';
      modalPhone.style.display = 'flex';
    } else {
      startDepositSession();
    }
  }

  function startDepositSession() {
    modalPhone.style.display = 'none';
    sessionPET = 0;
    sessionCAN = 0;
    sessionPetCount.textContent = '0';
    sessionCanCount.textContent = '0';
    updateSessionPoints();

    sessionStudentName.textContent = activeStudent.full_name;
    sessionStudentInfo.textContent = `${activeStudent.room} (รหัส ${activeStudent.student_id})`;

    showScreen('screen-deposit');
  }

  // --------------------------------------------------------------------------
  // Complete Session & Celebration (Ticket 03)
  // --------------------------------------------------------------------------
  function finishDepositSession() {
    const earned = (sessionPET * 10) + (sessionCAN * 20);
    activeStudent.current_points += earned;

    document.getElementById('summary-pet-count').textContent = `${sessionPET} ใบ`;
    document.getElementById('summary-can-count').textContent = `${sessionCAN} ใบ`;
    document.getElementById('summary-earned-pts').textContent = `+${earned} แต้ม`;
    document.getElementById('summary-total-pts').textContent = `${activeStudent.current_points} แต้ม`;

    showScreen('screen-summary');

    // Grand Celebration Confetti
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 }
      });
    }

    // 10s Auto countdown back to welcome
    let sec = 10;
    const cdElem = document.getElementById('countdown-sec');
    cdElem.textContent = sec;
    clearInterval(returnCountdownTimer);
    returnCountdownTimer = setInterval(() => {
      sec--;
      cdElem.textContent = sec;
      if (sec <= 0) {
        clearInterval(returnCountdownTimer);
        resetToWelcome();
      }
    }, 1000);
  }

  function resetToWelcome() {
    clearInterval(returnCountdownTimer);
    pinInput = '';
    activeStudent = null;
    sessionPET = 0;
    sessionCAN = 0;
    modalPhone.style.display = 'none';
    updatePinDisplay();
    showScreen('screen-welcome');
  }

  // --------------------------------------------------------------------------
  // Event Bindings
  // --------------------------------------------------------------------------
  function bindEvents() {
    // Start button
    document.getElementById('btn-start-flow').addEventListener('click', () => {
      pinInput = '';
      updatePinDisplay();
      showScreen('screen-numpad');
    });

    // Back to welcome
    document.getElementById('btn-back-to-welcome').addEventListener('click', resetToWelcome);

    // Numpad keys
    document.querySelectorAll('.num-key[data-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (pinInput.length < 5) {
          pinInput += btn.getAttribute('data-key');
          updatePinDisplay();
        }
      });
    });

    document.getElementById('btn-num-clear').addEventListener('click', () => {
      pinInput = '';
      updatePinDisplay();
    });

    document.getElementById('btn-num-backspace').addEventListener('click', () => {
      pinInput = pinInput.slice(0, -1);
      updatePinDisplay();
    });

    // Submit ID button
    btnSubmitId.addEventListener('click', checkPhoneAndProceed);

    // Modal Numpad Keys (Phone Modal)
    document.querySelectorAll('.m-key[data-mkey]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (phoneModalInput.length < 10) {
          phoneModalInput += btn.getAttribute('data-mkey');
          inputPhoneModal.value = phoneModalInput;
        }
      });
    });

    document.getElementById('btn-modal-clear').addEventListener('click', () => {
      phoneModalInput = '';
      inputPhoneModal.value = '';
    });

    document.getElementById('btn-modal-backspace').addEventListener('click', () => {
      phoneModalInput = phoneModalInput.slice(0, -1);
      inputPhoneModal.value = phoneModalInput;
    });

    // Modal Actions (ADR-0001)
    document.getElementById('btn-modal-phone-skip').addEventListener('click', () => {
      startDepositSession();
    });

    document.getElementById('btn-modal-phone-save').addEventListener('click', () => {
      if (phoneModalInput.length >= 9 && activeStudent) {
        activeStudent.phone_number = phoneModalInput;
      }
      startDepositSession();
    });

    // Finish deposit
    document.getElementById('btn-finish-deposit').addEventListener('click', finishDepositSession);

    // Summary done button
    document.getElementById('btn-done-back').addEventListener('click', resetToWelcome);

    // Hardware Simulator Buttons
    document.getElementById('sim-drop-pet').addEventListener('click', () => simulator.insertPET());
    document.getElementById('sim-drop-can').addEventListener('click', () => simulator.insertCAN());
    document.getElementById('sim-drop-reject').addEventListener('click', () => simulator.insertReject());

    document.getElementById('sim-pet-bin-slider').addEventListener('input', (e) => {
      simulator.setBinLevels(parseInt(e.target.value, 10), simulator.canBinLevel);
    });

    document.getElementById('sim-can-bin-slider').addEventListener('input', (e) => {
      simulator.setBinLevels(simulator.petBinLevel, parseInt(e.target.value, 10));
    });

    // Simulator dock toggle
    const simDock = document.getElementById('sim-dock');
    document.getElementById('sim-dock-toggle').addEventListener('click', () => {
      simDock.classList.toggle('collapsed');
    });

    // Clock
    setInterval(() => {
      const now = new Date();
      document.getElementById('current-time').textContent = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }, 1000);
  }

  // Boot
  document.addEventListener('DOMContentLoaded', () => {
    loadStudentData();
    bindEvents();
  });
})();
