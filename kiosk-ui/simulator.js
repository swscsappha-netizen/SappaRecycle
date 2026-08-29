/**
 * Hardware Controller & Sensor Fusion Simulator
 * Simulates:
 * - IR Sensors (Infeed & Tunnel)
 * - AI Computer Vision Inference
 * - Inductive Proximity Sensor
 * - Dual MG996R Servos (Trapdoor 1: PET, Trapdoor 2: CAN)
 * - Dual Ultrasonic Distance Sensors (PET & CAN bins)
 */

class HardwareSimulator {
  constructor(onEvent) {
    this.onEvent = onEvent || (() => {});
    this.petBinLevel = 25; // %
    this.canBinLevel = 18; // %
    this.isProcessing = false;
  }

  // Simulate inserting a PET bottle
  async insertPET() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.onEvent('SENSOR_TRIGGER', { sensor: 'IR_INFEED', state: 'BLOCKED' });
    this.onEvent('CONVEYOR_STATE', { state: 'FORWARD', speed: 100 });
    
    await this._delay(600);
    this.onEvent('SENSOR_TRIGGER', { sensor: 'IR_TUNNEL', state: 'BLOCKED' });
    this.onEvent('AI_INFERENCE', { class: 'PET', confidence: 0.984, bbox: [20, 20, 160, 160] });
    this.onEvent('INDUCTIVE_SENSOR', { metalDetected: false });

    // Sensor Fusion Decision: No Metal + AI=PET -> Confirmed PET
    await this._delay(800);
    this.onEvent('TRAPDOOR_TRIGGER', { door: 'TRAPDOOR_1_PET', angle: 90, action: 'OPEN' });
    this.petBinLevel = Math.min(100, this.petBinLevel + 2);
    this.onEvent('BIN_LEVEL_UPDATE', { petLevel: this.petBinLevel, canLevel: this.canBinLevel });

    await this._delay(700);
    this.onEvent('TRAPDOOR_TRIGGER', { door: 'TRAPDOOR_1_PET', angle: 0, action: 'CLOSE' });
    this.onEvent('CONVEYOR_STATE', { state: 'STOP', speed: 0 });
    this.onEvent('ITEM_SORTED', { item: 'PET', points: 10 });

    this.isProcessing = false;
  }

  // Simulate inserting an Aluminium Can
  async insertCAN() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.onEvent('SENSOR_TRIGGER', { sensor: 'IR_INFEED', state: 'BLOCKED' });
    this.onEvent('CONVEYOR_STATE', { state: 'FORWARD', speed: 100 });

    await this._delay(600);
    this.onEvent('SENSOR_TRIGGER', { sensor: 'IR_TUNNEL', state: 'BLOCKED' });
    this.onEvent('AI_INFERENCE', { class: 'CAN', confidence: 0.991, bbox: [25, 25, 150, 150] });
    this.onEvent('INDUCTIVE_SENSOR', { metalDetected: true });

    // Sensor Fusion Decision: Metal + AI=CAN -> Confirmed CAN
    await this._delay(800);
    this.onEvent('TRAPDOOR_TRIGGER', { door: 'TRAPDOOR_2_CAN', angle: 90, action: 'OPEN' });
    this.canBinLevel = Math.min(100, this.canBinLevel + 2);
    this.onEvent('BIN_LEVEL_UPDATE', { petLevel: this.petBinLevel, canLevel: this.canBinLevel });

    await this._delay(700);
    this.onEvent('TRAPDOOR_TRIGGER', { door: 'TRAPDOOR_2_CAN', angle: 0, action: 'CLOSE' });
    this.onEvent('CONVEYOR_STATE', { state: 'STOP', speed: 0 });
    this.onEvent('ITEM_SORTED', { item: 'CAN', points: 20 });

    this.isProcessing = false;
  }

  // Simulate inserting a foreign/rejected object
  async insertReject() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.onEvent('SENSOR_TRIGGER', { sensor: 'IR_INFEED', state: 'BLOCKED' });
    this.onEvent('CONVEYOR_STATE', { state: 'FORWARD', speed: 100 });

    await this._delay(600);
    this.onEvent('SENSOR_TRIGGER', { sensor: 'IR_TUNNEL', state: 'BLOCKED' });
    this.onEvent('AI_INFERENCE', { class: 'UNKNOWN', confidence: 0.34, bbox: [30, 30, 140, 140] });
    this.onEvent('INDUCTIVE_SENSOR', { metalDetected: false });

    // Reject Flow: All trapdoors stay closed, conveyor reverses 3s
    await this._delay(800);
    this.onEvent('CONVEYOR_STATE', { state: 'REVERSE', speed: 100, duration: 3000 });
    this.onEvent('ITEM_REJECTED', { reason: 'UNRECOGNIZED_OBJECT' });

    await this._delay(3000);
    this.onEvent('CONVEYOR_STATE', { state: 'STOP', speed: 0 });
    this.isProcessing = false;
  }

  setBinLevels(petLevel, canLevel) {
    this.petBinLevel = petLevel;
    this.canBinLevel = canLevel;
    this.onEvent('BIN_LEVEL_UPDATE', { petLevel: this.petBinLevel, canLevel: this.canBinLevel });
  }

  _delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }
}

window.HardwareSimulator = HardwareSimulator;
