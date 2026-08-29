const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

// Load raw student database
const rawStudents = JSON.parse(fs.readFileSync('d:/โครงงานวิศวะ/students_all_2906.json', 'utf-8'));

class FullSystem {
  constructor() {
    this.students = new Map();
    rawStudents.forEach(s => {
      this.students.set(s.student_id, {
        student_id: s.student_id,
        full_name: s.full_name,
        room: s.room,
        no: s.no,
        phone_number: null,
        line_user_id: null,
        current_points: 0,
        total_bottles_recycled: 0,
        is_council_member: s.student_id === '34890'
      });
    });

    this.rewards = new Map([
      ['rew-1', { id: 'rew-1', title: 'Eco Gel Pen', points: 30, stock: 150 }],
      ['rew-2', { id: 'rew-2', title: 'Notebook A5', points: 50, stock: 80 }]
    ]);

    this.coupons = new Map();
    this.recycle_logs = [];
    this.petBinLevel = 20;
    this.canBinLevel = 15;
    this.binWarningActive = false;
  }

  // Ultrasonic sensor check
  updateBinSensors(petLevel, canLevel) {
    this.petBinLevel = petLevel;
    this.canBinLevel = canLevel;
    this.binWarningActive = (petLevel >= 90 || canLevel >= 90);
    return {
      petBinLevel: this.petBinLevel,
      canBinLevel: this.canBinLevel,
      warning: this.binWarningActive
    };
  }

  // Kiosk deposit flow
  kioskDeposit(studentId, petCount, canCount, phoneInput = null) {
    const student = this.students.get(studentId);
    if (!student) throw new Error('STUDENT_NOT_FOUND');

    if (phoneInput && phoneInput.trim().length >= 9) {
      student.phone_number = phoneInput.trim();
    }

    const earned = (petCount * 10) + (canCount * 20);
    student.current_points += earned;
    student.total_bottles_recycled += (petCount + canCount);

    for (let i = 0; i < petCount; i++) {
      this.recycle_logs.push({ student_id: studentId, item: 'PET', points: 10, time: new Date() });
    }
    for (let i = 0; i < canCount; i++) {
      this.recycle_logs.push({ student_id: studentId, item: 'CAN', points: 20, time: new Date() });
    }

    return {
      student_id: studentId,
      earned,
      current_points: student.current_points,
      total_bottles: student.total_bottles_recycled
    };
  }

  // LIFF Redeem
  liffRedeem(studentId, rewardId) {
    const student = this.students.get(studentId);
    if (!student) throw new Error('STUDENT_NOT_FOUND');

    if (!student.phone_number || student.phone_number.trim() === '') {
      throw new Error('PHONE_REQUIRED_ADR_0001');
    }

    const reward = this.rewards.get(rewardId);
    if (!reward) throw new Error('REWARD_NOT_FOUND');
    if (reward.stock <= 0) throw new Error('OUT_OF_STOCK');
    if (student.current_points < reward.points) throw new Error('INSUFFICIENT_POINTS');

    student.current_points -= reward.points;
    reward.stock -= 1;

    const couponCode = 'CPN-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const coupon = {
      code: couponCode,
      student_id: studentId,
      student_name: student.full_name,
      reward_id: rewardId,
      reward_title: reward.title,
      status: 'ACTIVE',
      created_at: new Date()
    };
    this.coupons.set(couponCode, coupon);
    return coupon;
  }

  // Council handover
  councilConfirmHandover(councilStudentId, couponCode) {
    const council = this.students.get(councilStudentId);
    if (!council || !council.is_council_member) {
      throw new Error('UNAUTHORIZED_NOT_COUNCIL');
    }

    const coupon = this.coupons.get(couponCode);
    if (!coupon) throw new Error('COUPON_NOT_FOUND');
    if (coupon.status === 'REDEEMED') throw new Error('COUPON_ALREADY_REDEEMED');

    coupon.status = 'REDEEMED';
    coupon.redeemed_at = new Date();
    coupon.redeemed_by = council.full_name;
    return { success: true, status: 'REDEEMED' };
  }
}

test('Ticket 07 - End-to-End System Journey Integration', () => {
  const system = new FullSystem();

  // Test 1: Ultrasonic Bin Warning
  assert.equal(system.binWarningActive, false);
  const normalStatus = system.updateBinSensors(50, 40);
  assert.equal(normalStatus.warning, false);

  const fullStatus = system.updateBinSensors(92, 30);
  assert.equal(fullStatus.warning, true, 'Warning banner must activate when bin >= 90%');

  // Test 2: Student Channon (34889) uses Kiosk
  const studentId = '34889';
  const initialStudent = system.students.get(studentId);
  assert.equal(initialStudent.current_points, 0);

  // Student deposits 3 PET (30 pts) and 2 CANs (40 pts) and skips entering phone (ADR-0001)
  const depositSession1 = system.kioskDeposit(studentId, 3, 2, null);
  assert.equal(depositSession1.earned, 70);
  assert.equal(depositSession1.current_points, 70);
  assert.equal(initialStudent.phone_number, null, 'Phone should remain null when skipped');

  // Test 3: Student attempts to redeem on LIFF without phone -> Blocked by ADR-0001
  assert.throws(() => {
    system.liffRedeem(studentId, 'rew-1');
  }, /PHONE_REQUIRED_ADR_0001/);

  // Test 4: Student enters phone number and completes redemption for Eco Gel Pen (30 pts)
  initialStudent.phone_number = '0812345678';
  const coupon = system.liffRedeem(studentId, 'rew-1');
  assert.equal(coupon.status, 'ACTIVE');
  assert.equal(initialStudent.current_points, 40); // 70 - 30 = 40
  assert.equal(system.rewards.get('rew-1').stock, 149);

  // Test 5: Council member (34890) scans QR and marks REDEEMED
  const councilId = '34890';
  const handoverResult = system.councilConfirmHandover(councilId, coupon.code);
  assert.equal(handoverResult.status, 'REDEEMED');

  // Test 6: Re-scan attempt is rejected
  assert.throws(() => {
    system.councilConfirmHandover(councilId, coupon.code);
  }, /COUPON_ALREADY_REDEEMED/);

  // Test 7: Audit log verification
  const studentLogs = system.recycle_logs.filter(l => l.student_id === studentId);
  assert.equal(studentLogs.length, 5, 'Must have 5 recycle logs (3 PET + 2 CAN)');
});
