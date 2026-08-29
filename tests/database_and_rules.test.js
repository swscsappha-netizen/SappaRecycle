const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

// Load 2,906 students
const students = JSON.parse(fs.readFileSync('d:/โครงงานวิศวะ/students_all_2906.json', 'utf-8'));

test('Ticket 01 - Student Roster Integrity (2,906 records)', () => {
  assert.equal(students.length, 2906, 'Should contain exactly 2,906 students');
  
  const idSet = new Set();
  students.forEach(s => {
    assert.match(s.student_id, /^\d{5}$/, `Student ID ${s.student_id} must be exactly 5 digits`);
    assert.ok(s.full_name && s.full_name.trim().length > 0, `Student ${s.student_id} must have a valid full_name`);
    assert.match(s.room, /^ม\.[1-6]\/\d+$/, `Room ${s.room} must match Thai grade/room format`);
    idSet.add(s.student_id);
  });

  assert.equal(idSet.size, 2906, 'All 2,906 student IDs must be unique');
});

// Mock database state machine to test business rules
class MockDatabase {
  constructor() {
    this.students = new Map();
    students.forEach(s => {
      this.students.set(s.student_id, {
        student_id: s.student_id,
        full_name: s.full_name,
        room: s.room,
        no: s.no,
        phone_number: null,
        line_user_id: null,
        current_points: 0,
        total_bottles_recycled: 0,
        is_council_member: false
      });
    });

    this.rewards = new Map([
      ['rew-1', { id: 'rew-1', title: 'Eco Gel Pen', points_required: 30, stock: 10 }],
      ['rew-2', { id: 'rew-2', title: 'Notebook A5', points_required: 50, stock: 5 }],
      ['rew-3', { id: 'rew-3', title: 'Thermos Bottle', points_required: 250, stock: 0 }] // Out of stock
    ]);

    this.coupons = new Map();
    this.recycle_logs = [];
  }

  getStudent(studentId) {
    return this.students.get(studentId) || null;
  }

  updatePhone(studentId, phone) {
    const student = this.getStudent(studentId);
    if (!student) throw new Error('Student not found');
    student.phone_number = phone;
    return student;
  }

  bindLineUser(studentId, lineUserId) {
    const student = this.getStudent(studentId);
    if (!student) throw new Error('Student not found');
    student.line_user_id = lineUserId;
    return student;
  }

  creditRecycleBatch(studentId, petCount, canCount) {
    const student = this.getStudent(studentId);
    if (!student) throw new Error('Student not found');

    const pointsEarned = (petCount * 10) + (canCount * 20);
    const totalItems = petCount + canCount;

    student.current_points += pointsEarned;
    student.total_bottles_recycled += totalItems;

    for (let i = 0; i < petCount; i++) {
      this.recycle_logs.push({ student_id: studentId, item: 'PET', points: 10, time: new Date() });
    }
    for (let i = 0; i < canCount; i++) {
      this.recycle_logs.push({ student_id: studentId, item: 'CAN', points: 20, time: new Date() });
    }

    return {
      pointsEarned,
      current_points: student.current_points,
      total_bottles_recycled: student.total_bottles_recycled
    };
  }

  redeemRewardCoupon(studentId, rewardId, couponCode) {
    const student = this.getStudent(studentId);
    if (!student) throw new Error('Student not found');

    // ADR-0001 Phone Number requirement check
    if (!student.phone_number || student.phone_number.trim() === '') {
      throw new Error('Phone number required before redeeming reward (ADR-0001)');
    }

    const reward = this.rewards.get(rewardId);
    if (!reward) throw new Error('Reward not found');
    if (reward.stock <= 0) throw new Error('Reward out of stock');
    if (student.current_points < reward.points_required) throw new Error('Insufficient points');

    student.current_points -= reward.points_required;
    reward.stock -= 1;

    const coupon = {
      coupon_code: couponCode,
      student_id: studentId,
      reward_id: rewardId,
      status: 'ACTIVE',
      created_at: new Date()
    };
    this.coupons.set(couponCode, coupon);

    return {
      success: true,
      coupon_code: couponCode,
      remaining_points: student.current_points,
      remaining_stock: reward.stock
    };
  }

  confirmHandover(couponCode, councilLineId) {
    const councilUser = Array.from(this.students.values()).find(s => s.line_user_id === councilLineId);
    if (!councilUser || !councilUser.is_council_member) {
      throw new Error('Unauthorized: User is not a council member');
    }

    const coupon = this.coupons.get(couponCode);
    if (!coupon) throw new Error('Coupon not found');
    if (coupon.status === 'REDEEMED') throw new Error('Coupon already redeemed');
    if (coupon.status !== 'ACTIVE') throw new Error('Coupon is not active');

    coupon.status = 'REDEEMED';
    coupon.redeemed_at = new Date();
    coupon.redeemed_by_line_id = councilLineId;

    return { success: true, status: 'REDEEMED' };
  }
}

test('Ticket 01 - Business Logic & Rule Verification', () => {
  const db = new MockDatabase();
  const testStudentId = '34889';

  // 1. Initial State
  const student = db.getStudent(testStudentId);
  assert.ok(student, 'Should find student 34889');
  assert.equal(student.current_points, 0);

  // 2. Deposit 3 PET (30 pts) and 2 CANs (40 pts) -> 70 pts total
  const depositResult = db.creditRecycleBatch(testStudentId, 3, 2);
  assert.equal(depositResult.pointsEarned, 70);
  assert.equal(depositResult.current_points, 70);
  assert.equal(depositResult.total_bottles_recycled, 5);

  // 3. Attempt redemption without phone number -> MUST FAIL (ADR-0001)
  assert.throws(() => {
    db.redeemRewardCoupon(testStudentId, 'rew-1', 'CPN-123456');
  }, /Phone number required before redeeming reward/);

  // 4. Update phone number (ADR-0001)
  db.updatePhone(testStudentId, '0812345678');
  assert.equal(db.getStudent(testStudentId).phone_number, '0812345678');

  // 5. Successful redemption for rew-1 (30 pts)
  const redeemResult = db.redeemRewardCoupon(testStudentId, 'rew-1', 'CPN-123456');
  assert.equal(redeemResult.success, true);
  assert.equal(redeemResult.remaining_points, 40);
  assert.equal(redeemResult.remaining_stock, 9);

  // 6. Attempt redemption for out-of-stock item -> MUST FAIL
  assert.throws(() => {
    db.redeemRewardCoupon(testStudentId, 'rew-3', 'CPN-FAIL');
  }, /Reward out of stock/);

  // 7. Setup council member
  const councilStudentId = '34890';
  const councilStudent = db.getStudent(councilStudentId);
  councilStudent.is_council_member = true;
  councilStudent.line_user_id = 'LINE_COUNCIL_01';

  // 8. Unauthorized user attempts to confirm handover -> MUST FAIL
  assert.throws(() => {
    db.confirmHandover('CPN-123456', 'LINE_RANDOM_USER');
  }, /Unauthorized/);

  // 9. Council member confirms handover -> MUST SUCCEED
  const handoverResult = db.confirmHandover('CPN-123456', 'LINE_COUNCIL_01');
  assert.equal(handoverResult.status, 'REDEEMED');

  // 10. Attempt to scan already redeemed coupon -> MUST PREVENT REUSE
  assert.throws(() => {
    db.confirmHandover('CPN-123456', 'LINE_COUNCIL_01');
  }, /Coupon already redeemed/);
});
