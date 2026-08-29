const test = require('node:test');
const assert = require('node:assert/strict');

class LiffStore {
  constructor() {
    this.students = new Map([
      ['34889', { student_id: '34889', full_name: 'เด็กชายชาญนนท์ -', room: 'ม.1/1', phone_number: null, points: 140, is_council: false }],
      ['34890', { student_id: '34890', full_name: 'เด็กชายณัฐชนน อรรถศิริ', room: 'ม.1/1', phone_number: '0899999999', points: 260, is_council: true }]
    ]);

    this.rewards = [
      { id: 'rew-1', title: 'Eco Gel Pen', points: 30, stock: 10 },
      { id: 'rew-4', title: 'Thermos Bottle', points: 250, stock: 1 }
    ];

    this.coupons = [];
  }

  getStudent(id) {
    return this.students.get(id);
  }

  updatePhone(id, phone) {
    const s = this.getStudent(id);
    if (!s) throw new Error('Not found');
    s.phone_number = phone;
    return s;
  }

  redeemReward(studentId, rewardId) {
    const s = this.getStudent(studentId);
    if (!s) throw new Error('Student not found');

    // ADR-0001 Phone Requirement Check
    if (!s.phone_number || s.phone_number.trim() === '') {
      throw new Error('PHONE_REQUIRED_ADR_0001');
    }

    const r = this.rewards.find(x => x.id === rewardId);
    if (!r) throw new Error('Reward not found');
    if (r.stock <= 0) throw new Error('Out of stock');
    if (s.points < r.points) throw new Error('Insufficient points');

    s.points -= r.points;
    r.stock -= 1;

    const couponCode = 'CPN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const coupon = {
      code: couponCode,
      student_id: s.student_id,
      reward_id: r.id,
      status: 'ACTIVE',
      created_at: new Date()
    };
    this.coupons.push(coupon);
    return coupon;
  }

  councilVerifyAndRedeem(councilStudentId, couponCode) {
    const council = this.getStudent(councilStudentId);
    if (!council || !council.is_council) {
      throw new Error('UNAUTHORIZED_NOT_COUNCIL');
    }

    const c = this.coupons.find(x => x.code === couponCode);
    if (!c) throw new Error('COUPON_NOT_FOUND');
    if (c.status === 'REDEEMED') throw new Error('ALREADY_REDEEMED');

    c.status = 'REDEEMED';
    c.redeemed_at = new Date();
    c.redeemed_by = council.full_name;
    return { success: true, status: 'REDEEMED' };
  }
}

test('Ticket 04, 05, 06 - LINE LIFF End-to-End Flow Test', () => {
  const store = new LiffStore();
  const studentId = '34889';
  const councilId = '34890';

  // 1. Initial State: student has no phone number
  const student = store.getStudent(studentId);
  assert.equal(student.phone_number, null);

  // 2. Attempt redemption without phone -> MUST TRIGGER ADR-0001 ERROR
  assert.throws(() => {
    store.redeemReward(studentId, 'rew-1');
  }, /PHONE_REQUIRED_ADR_0001/);

  // 3. Student updates phone in profile (ADR-0001)
  store.updatePhone(studentId, '0812345678');
  assert.equal(store.getStudent(studentId).phone_number, '0812345678');

  // 4. Student successfully redeems reward (Eco Gel Pen: 30 pts)
  const initialPoints = store.getStudent(studentId).points; // 140
  const coupon = store.redeemReward(studentId, 'rew-1');
  assert.equal(coupon.status, 'ACTIVE');
  assert.equal(store.getStudent(studentId).points, initialPoints - 30); // 110
  assert.equal(store.rewards.find(r => r.id === 'rew-1').stock, 9);

  // 5. Non-council member attempts to verify -> MUST FAIL
  assert.throws(() => {
    store.councilVerifyAndRedeem(studentId, coupon.code);
  }, /UNAUTHORIZED_NOT_COUNCIL/);

  // 6. Council member verifies and confirms handover -> MUST SUCCEED
  const handover = store.councilVerifyAndRedeem(councilId, coupon.code);
  assert.equal(handover.status, 'REDEEMED');

  // 7. Re-scanning already redeemed coupon -> MUST FAIL TO PREVENT FRAUD
  assert.throws(() => {
    store.councilVerifyAndRedeem(councilId, coupon.code);
  }, /ALREADY_REDEEMED/);
});
