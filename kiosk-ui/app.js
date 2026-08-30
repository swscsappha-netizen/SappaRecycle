/**
 * KIOSK APPLICATION CONTROLLER - SappaRecycle (โรงเรียนสรรพวิทยาคม)
 * Supports:
 * - 4 Touchscreen Screens (Welcome -> 5-Digit PIN ID -> Live Deposit -> Summary)
 * - Real-time Supabase Cloud sync with offline fallback for 2,906 students
 * - Web Audio API Synthetic Sound Engine (Chimes, Beeps, Fanfare, Buzz)
 * - WebSerial API USB Serial Port Controller for Raspberry Pi 4 / Microcontroller
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
  let serialPort = null;
  let serialReader = null;

  // Supabase Client
  let supabaseClient = null;
  if (window.supabase && window.APP_CONFIG) {
    try {
      supabaseClient = window.supabase.createClient(
        window.APP_CONFIG.SUPABASE_URL,
        window.APP_CONFIG.SUPABASE_ANON_KEY
      );
      console.log("✅ Kiosk Supabase Cloud Connected");
    } catch (e) {
      console.warn("Supabase init error:", e);
    }
  }

  // Local student cache (for offline fallback)
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

  // Serial elements
  const btnSerialConnect = document.getElementById('btn-serial-connect');
  const serialStatusText = document.getElementById('serial-status-text');
  const serialBtnText = document.getElementById('serial-btn-text');

  // Initialize Hardware Simulator
  const simulator = new window.HardwareSimulator(handleHardwareEvent);

  // Load 2,906 students offline fallback
  async function loadStudentData() {
    try {
      const resp = await fetch('../students_all_2906.json');
      if (resp.ok) {
        const list = await resp.json();
        list.forEach(s => studentDatabase.set(s.student_id, {
          student_id: s.student_id,
          full_name: s.full_name,
          room: s.room,
          no: s.no,
          phone_number: s.phone_number || null,
          current_points: s.current_points || 0,
          total_bottles: s.total_bottles || 0
        }));
        console.log(`Loaded ${studentDatabase.size} students into Kiosk offline cache.`);
      }
    } catch (e) {
      console.warn('Local JSON load fallback');
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
  // Hardware Event Handler (Simulator & Serial)
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
      if (window.kioskSound) window.kioskSound.playCoinChime();
    }

    if (eventType === 'ITEM_REJECTED') {
      aiBox.style.display = 'none';
      sensorStatus.innerHTML = '<i data-lucide="alert-triangle"></i> ขยะแปลกปลอม - ส่งคืนแล้ว';
      sensorStatus.style.color = '#ef4444';
      if (window.kioskSound) window.kioskSound.playRejectBuzz();
      if (window.lucide) lucide.createIcons();
      setTimeout(() => {
        sensorStatus.innerHTML = '<i data-lucide="activity"></i> พร้อมรับขวด';
        sensorStatus.style.color = '#34d399';
        if (window.lucide) lucide.createIcons();
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
    const totalPts = (sessionPET * (window.APP_CONFIG?.POINTS_PET || 10)) + 
                     (sessionCAN * (window.APP_CONFIG?.POINTS_CAN || 20));
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
  async function updatePinDisplay() {
    let text = '';
    for (let i = 0; i < 5; i++) {
      text += (i < pinInput.length ? pinInput[i] : '_') + ' ';
    }
    pinDisplay.textContent = text.trim();

    if (pinInput.length === 5) {
      previewName.textContent = 'กำลังค้นหาข้อมูล...';
      previewRoom.textContent = `รหัส ${pinInput}`;
      studentPreview.style.display = 'flex';

      // 1. Try Supabase Cloud first
      let resolvedStudent = null;
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .eq('student_id', pinInput)
            .maybeSingle();

          if (data && !error) {
            resolvedStudent = data;
          }
        } catch (err) {
          console.warn("Supabase lookup error, falling back to local memory:", err);
        }
      }

      // 2. Fallback to local memory cache
      if (!resolvedStudent) {
        resolvedStudent = studentDatabase.get(pinInput);
      }

      if (resolvedStudent) {
        activeStudent = resolvedStudent;
        previewName.textContent = resolvedStudent.full_name;
        previewRoom.textContent = `ชั้น ${resolvedStudent.room} (เลขที่ ${resolvedStudent.no || '-'}) | รหัส ${resolvedStudent.student_id}`;
        btnSubmitId.disabled = false;
      } else {
        activeStudent = { student_id: pinInput, full_name: 'นักเรียนสรรพวิทย์ (ทั่วไป)', room: 'ม.1/1', current_points: 0 };
        previewName.textContent = 'นักเรียนใหม่ (ไม่พบในสารบบ)';
        previewRoom.textContent = `รหัส ${pinInput}`;
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
    if (window.kioskSound) window.kioskSound.playKeyClick();

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
    if (window.kioskSound) window.kioskSound.playKeyClick();
  }

  // --------------------------------------------------------------------------
  // Complete Session & Supabase Cloud Sync (Ticket 03 & ADR-0012)
  // --------------------------------------------------------------------------
  async function finishDepositSession() {
    if (window.kioskSound) window.kioskSound.playCelebrationFanfare();

    const earnedPts = (sessionPET * (window.APP_CONFIG?.POINTS_PET || 10)) + 
                      (sessionCAN * (window.APP_CONFIG?.POINTS_CAN || 20));
    const totalItems = sessionPET + sessionCAN;

    // Update student state
    const prevPoints = activeStudent.current_points || 0;
    const newPoints = prevPoints + earnedPts;
    const prevBottles = activeStudent.total_bottles_recycled || activeStudent.total_bottles || 0;
    const newBottles = prevBottles + totalItems;

    activeStudent.current_points = newPoints;
    activeStudent.total_bottles_recycled = newBottles;

    document.getElementById('summary-pet-count').textContent = `${sessionPET} ใบ`;
    document.getElementById('summary-can-count').textContent = `${sessionCAN} ใบ`;
    document.getElementById('summary-earned-pts').textContent = `+${earnedPts} แต้ม`;
    document.getElementById('summary-total-pts').textContent = `${newPoints} แต้ม`;

    showScreen('screen-summary');

    // Grand Celebration Confetti
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 }
      });
    }

    // 10s Auto countdown back to welcome
    let sec = window.APP_CONFIG?.AUTO_RETURN_COUNTDOWN_SEC || 10;
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

    // Sync to Supabase Cloud asynchronously
    if (supabaseClient && activeStudent && totalItems > 0) {
      try {
        // 1. Insert PET logs
        const logsToInsert = [];
        for (let i = 0; i < sessionPET; i++) {
          logsToInsert.push({
            student_id: activeStudent.student_id,
            item_type: 'PET',
            points_earned: window.APP_CONFIG?.POINTS_PET || 10,
            status: 'ACCEPTED'
          });
        }
        for (let i = 0; i < sessionCAN; i++) {
          logsToInsert.push({
            student_id: activeStudent.student_id,
            item_type: 'CAN',
            points_earned: window.APP_CONFIG?.POINTS_CAN || 20,
            status: 'ACCEPTED'
          });
        }

        if (logsToInsert.length > 0) {
          await supabaseClient.from('recycle_logs').insert(logsToInsert);
        }

        // 2. Update Student Points & Bottles
        const updatePayload = {
          current_points: newPoints,
          total_bottles_recycled: newBottles
        };
        if (activeStudent.phone_number) {
          updatePayload.phone_number = activeStudent.phone_number;
        }

        await supabaseClient
          .from('students')
          .update(updatePayload)
          .eq('student_id', activeStudent.student_id);

        console.log(`✅ Synced ${totalItems} items (+${earnedPts} pts) to Supabase Cloud for student ${activeStudent.student_id}`);
      } catch (err) {
        console.error("Cloud sync error:", err);
      }
    }
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
  // WebSerial API Manager for Raspberry Pi 4 USB Serial
  // --------------------------------------------------------------------------
  async function connectWebSerial() {
    if (!('serial' in navigator)) {
      alert("เบราว์เซอร์นี้ยังไม่รองรับ WebSerial API (แนะนำให้ใช้ Google Chrome หรือ Chromium บน Raspberry Pi 4)");
      return;
    }

    try {
      serialPort = await navigator.serial.requestPort();
      await serialPort.open({ baudRate: window.APP_CONFIG?.SERIAL_BAUD_RATE || 115200 });

      serialStatusText.textContent = "สถานะ: เชื่อมต่อพอร์ต USB สำเร็จ (Live Serial)";
      serialStatusText.style.color = "#34d399";
      serialBtnText.textContent = "เชื่อมต่อ USB แล้ว ✅";
      btnSerialConnect.style.background = "#065f46";

      readSerialStream();
    } catch (err) {
      console.warn("Serial connection error:", err);
      serialStatusText.textContent = "สถานะ: การเชื่อมต่อถูกยกเลิก / ไม่สำเร็จ";
      serialStatusText.style.color = "#f87171";
    }
  }

  async function readSerialStream() {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
    serialReader = textDecoder.readable.getReader();

    let buffer = '';
    try {
      while (true) {
        const { value, done } = await serialReader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep partial line

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) handleSerialCommand(trimmed);
        }
      }
    } catch (err) {
      console.warn("Serial read loop closed:", err);
    }
  }

  function handleSerialCommand(cmd) {
    console.log(`[SERIAL IN] ${cmd}`);
    if (cmd === 'DROP:PET') {
      simulator.insertPET();
    } else if (cmd === 'DROP:CAN') {
      simulator.insertCAN();
    } else if (cmd === 'DROP:REJECT') {
      simulator.insertReject();
    } else if (cmd.startsWith('BIN:PET:')) {
      const level = parseInt(cmd.replace('BIN:PET:', ''), 10);
      simulator.setBinLevels(level, simulator.canBinLevel);
    } else if (cmd.startsWith('BIN:CAN:')) {
      const level = parseInt(cmd.replace('BIN:CAN:', ''), 10);
      simulator.setBinLevels(simulator.petBinLevel, level);
    }
  }

  // --------------------------------------------------------------------------
  // Event Bindings
  // --------------------------------------------------------------------------
  function bindEvents() {
    // Start button
    document.getElementById('btn-start-flow').addEventListener('click', () => {
      if (window.kioskSound) window.kioskSound.playKeyClick();
      pinInput = '';
      updatePinDisplay();
      showScreen('screen-numpad');
    });

    // Back to welcome
    document.getElementById('btn-back-to-welcome').addEventListener('click', () => {
      if (window.kioskSound) window.kioskSound.playKeyClick();
      resetToWelcome();
    });

    // Numpad keys
    document.querySelectorAll('.num-key[data-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.kioskSound) window.kioskSound.playKeyClick();
        if (pinInput.length < 5) {
          pinInput += btn.getAttribute('data-key');
          updatePinDisplay();
        }
      });
    });

    document.getElementById('btn-num-clear').addEventListener('click', () => {
      if (window.kioskSound) window.kioskSound.playKeyClick();
      pinInput = '';
      updatePinDisplay();
    });

    document.getElementById('btn-num-backspace').addEventListener('click', () => {
      if (window.kioskSound) window.kioskSound.playKeyClick();
      pinInput = pinInput.slice(0, -1);
      updatePinDisplay();
    });

    // Submit ID button
    btnSubmitId.addEventListener('click', checkPhoneAndProceed);

    // Modal Numpad Keys (Phone Modal)
    document.querySelectorAll('.m-key[data-mkey]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.kioskSound) window.kioskSound.playKeyClick();
        if (phoneModalInput.length < 10) {
          phoneModalInput += btn.getAttribute('data-mkey');
          inputPhoneModal.value = phoneModalInput;
        }
      });
    });

    document.getElementById('btn-modal-clear').addEventListener('click', () => {
      if (window.kioskSound) window.kioskSound.playKeyClick();
      phoneModalInput = '';
      inputPhoneModal.value = '';
    });

    document.getElementById('btn-modal-backspace').addEventListener('click', () => {
      if (window.kioskSound) window.kioskSound.playKeyClick();
      phoneModalInput = phoneModalInput.slice(0, -1);
      inputPhoneModal.value = phoneModalInput;
    });

    // Modal Actions (ADR-0001)
    document.getElementById('btn-modal-phone-skip').addEventListener('click', () => {
      if (window.kioskSound) window.kioskSound.playKeyClick();
      startDepositSession();
    });

    document.getElementById('btn-modal-phone-save').addEventListener('click', () => {
      if (window.kioskSound) window.kioskSound.playKeyClick();
      if (phoneModalInput.length >= 9 && activeStudent) {
        activeStudent.phone_number = phoneModalInput;
      }
      startDepositSession();
    });

    // Finish deposit
    document.getElementById('btn-finish-deposit').addEventListener('click', finishDepositSession);

    // Summary done button
    document.getElementById('btn-done-back').addEventListener('click', () => {
      if (window.kioskSound) window.kioskSound.playKeyClick();
      resetToWelcome();
    });

    // Sound toggle
    const btnToggleSound = document.getElementById('btn-toggle-sound');
    if (btnToggleSound) {
      btnToggleSound.addEventListener('click', () => {
        if (window.kioskSound) {
          const isAudioOn = window.kioskSound.toggleMute();
          const soundIcon = document.getElementById('sound-icon');
          if (soundIcon) {
            soundIcon.setAttribute('data-lucide', isAudioOn ? 'volume-2' : 'volume-x');
            if (window.lucide) lucide.createIcons();
          }
        }
      });
    }

    // Fullscreen toggle
    const btnToggleFullscreen = document.getElementById('btn-toggle-fullscreen');
    if (btnToggleFullscreen) {
      btnToggleFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // WebSerial Connect button
    if (btnSerialConnect) {
      btnSerialConnect.addEventListener('click', connectWebSerial);
    }

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

    // Clock & Date
    function updateClock() {
      const now = new Date();
      document.getElementById('current-time').textContent = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const dateEl = document.getElementById('current-date');
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      }
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  // Boot
  document.addEventListener('DOMContentLoaded', () => {
    loadStudentData();
    bindEvents();
    if (window.lucide) lucide.createIcons();
  });
})();
