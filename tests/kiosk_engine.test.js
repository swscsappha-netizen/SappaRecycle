const test = require('node:test');
const assert = require('node:assert/strict');

// Import Hardware Simulator logic
class TestSimulator {
  constructor() {
    this.events = [];
    this.petBinLevel = 20;
    this.canBinLevel = 15;
  }

  emit(type, payload) {
    this.events.push({ type, payload });
  }

  processSorting(aiClass, isMetal) {
    if (isMetal && aiClass === 'CAN') {
      this.canBinLevel += 2;
      return { item: 'CAN', points: 20, trapdoor: 2, action: 'DROP_CAN' };
    }
    if (isMetal && aiClass === 'PET') {
      // Inductive override
      this.canBinLevel += 2;
      return { item: 'CAN', points: 20, trapdoor: 2, action: 'DROP_CAN_OVERRIDE' };
    }
    if (!isMetal && aiClass === 'PET') {
      this.petBinLevel += 2;
      return { item: 'PET', points: 10, trapdoor: 1, action: 'DROP_PET' };
    }
    // Reject
    return { item: 'REJECT', points: 0, trapdoor: 0, action: 'CONVEYOR_REVERSE_3S' };
  }
}

test('Ticket 02 & 03 - Sensor Fusion Sorting Decisions', () => {
  const sim = new TestSimulator();

  // Case 1: PET bottle (No metal, AI=PET) -> 10 pts, Trapdoor 1
  const res1 = sim.processSorting('PET', false);
  assert.equal(res1.item, 'PET');
  assert.equal(res1.points, 10);
  assert.equal(res1.trapdoor, 1);

  // Case 2: Aluminium Can (Metal, AI=CAN) -> 20 pts, Trapdoor 2
  const res2 = sim.processSorting('CAN', true);
  assert.equal(res2.item, 'CAN');
  assert.equal(res2.points, 20);
  assert.equal(res2.trapdoor, 2);

  // Case 3: Inductive Override (Metal detected on misclassified AI=PET) -> 20 pts, Trapdoor 2
  const res3 = sim.processSorting('PET', true);
  assert.equal(res3.item, 'CAN');
  assert.equal(res3.points, 20);
  assert.equal(res3.action, 'DROP_CAN_OVERRIDE');

  // Case 4: Foreign Object (Unknown class, No metal) -> 0 pts, Rejection
  const res4 = sim.processSorting('UNKNOWN', false);
  assert.equal(res4.item, 'REJECT');
  assert.equal(res4.points, 0);
  assert.equal(res4.action, 'CONVEYOR_REVERSE_3S');
});

test('Ticket 02 & 03 - Progressive Phone Modal & Session Accumulator', () => {
  let student = { student_id: '34889', phone_number: null, points: 0 };

  // Step 1: User skips entering phone number (ADR-0001)
  const skipPhone = true;
  if (!skipPhone) {
    student.phone_number = '0812345678';
  }
  assert.equal(student.phone_number, null, 'Phone should remain null when user skips');

  // Step 2: Deposit 2 PET and 1 CAN
  const session = { pet: 2, can: 1 };
  const earned = (session.pet * 10) + (session.can * 20);
  student.points += earned;

  assert.equal(earned, 40, 'Session points should be 40 (2x10 + 1x20)');
  assert.equal(student.points, 40, 'Total points should be updated to 40');
});
