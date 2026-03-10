/**
 * Tests for formatChargerNextStatus function
 */

const { formatChargerNextStatus } = require('../portalwriter');

describe('formatChargerNextStatus', () => {
  
  describe('edge cases', () => {
    it('should return "-- --" when chargerResult is null', () => {
      expect(formatChargerNextStatus(null)).toBe('-- --');
    });

    it('should return "-- --" when chargerResult is undefined', () => {
      expect(formatChargerNextStatus(undefined)).toBe('-- --');
    });
  });

  describe('stopped charging', () => {
    it('should return ⊘ when commandStop is 1', () => {
      const result = formatChargerNextStatus({
        commandStop: 1,
        threePhase: false,
        chargersetting: 'amp:6,psm:1,chargeStoped:0'
      });
      expect(result).toBe('⊘');
    });

    it('should return ⊘ when commandStop is 0 but function still checks it first', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: false,
        chargersetting: 'amp:6,psm:1,chargeStoped:0'
      });
      expect(result).not.toBe('⊘');
      expect(result).toBe('● -');
    });
  });

  describe('single phase charging', () => {
    it('should format 1 phase 6A as "● -"', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: false,
        chargersetting: 'amp:6,psm:1,chargeStoped:0'
      });
      expect(result).toBe('● -');
    });

    it('should format 1 phase 10A as "● --"', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: false,
        chargersetting: 'amp:10,psm:1,chargeStoped:0'
      });
      expect(result).toBe('● --');
    });

    it('should format 1 phase 12A as "● ---"', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: false,
        chargersetting: 'amp:12,psm:1,chargeStoped:0'
      });
      expect(result).toBe('● ---');
    });

    it('should format 1 phase 14A as "● ----"', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: false,
        chargersetting: 'amp:14,psm:1,chargeStoped:0'
      });
      expect(result).toBe('● ----');
    });

    it('should format 1 phase 16A as "● -----"', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: false,
        chargersetting: 'amp:16,psm:1,chargeStoped:0'
      });
      expect(result).toBe('● -----');
    });
  });

  describe('three phase charging', () => {
    it('should format 3 phase 6A as "●●● -"', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: true,
        chargersetting: 'amp:6,psm:2,chargeStoped:0'
      });
      expect(result).toBe('●●● -');
    });

    it('should format 3 phase 10A as "●●● --"', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: true,
        chargersetting: 'amp:10,psm:2,chargeStoped:0'
      });
      expect(result).toBe('●●● --');
    });

    it('should format 3 phase 16A as "●●● -----"', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: true,
        chargersetting: 'amp:16,psm:2,chargeStoped:0'
      });
      expect(result).toBe('●●● -----');
    });
  });

  describe('invalid amp values', () => {
    it('should format invalid amp (5A) as "● " (no dashes)', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: false,
        chargersetting: 'amp:5,psm:1,chargeStoped:0'
      });
      expect(result).toBe('● ');
    });

    it('should format amp value 99 as "● " (no dashes)', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: false,
        chargersetting: 'amp:99,psm:1,chargeStoped:0'
      });
      expect(result).toBe('● ');
    });
  });

  describe('missing or malformed chargersetting', () => {
    it('should format without chargersetting string as "● " (no amps extracted)', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: false
      });
      expect(result).toBe('● ');
    });

    it('should format with empty chargersetting as "● "', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: false,
        chargersetting: ''
      });
      expect(result).toBe('● ');
    });

    it('should format with malformed chargersetting as "● "', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: false,
        chargersetting: 'no_amp_value_here'
      });
      expect(result).toBe('● ');
    });
  });

  describe('real world examples', () => {
    it('should match real lastset.txt example - single phase 6A', () => {
      const chargerData = {
        chargersetting: 'amp:6,psm:1,chargeStoped:0',
        commandStop: false,
        woffset: 0,
        threePhase: false
      };
      expect(formatChargerNextStatus(chargerData)).toBe('● -');
    });

    it('should match real lastset.txt example - three phase 16A', () => {
      const chargerData = {
        chargersetting: 'amp:16,psm:2,chargeStoped:0',
        commandStop: false,
        woffset: 0,
        threePhase: true
      };
      expect(formatChargerNextStatus(chargerData)).toBe('●●● -----');
    });
  });

  describe('phase indicator extraction', () => {
    it('should correctly identify single phase (threePhase = false)', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: false,
        chargersetting: 'amp:6,psm:1,chargeStoped:0'
      });
      expect(result).toContain('●');
      expect(result).not.toContain('●●●');
    });

    it('should correctly identify three phase (threePhase = true)', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: true,
        chargersetting: 'amp:6,psm:2,chargeStoped:0'
      });
      expect(result).toContain('●●●');
    });

    it('should handle threePhase as truthy (non-boolean)', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: 1,  // number instead of boolean
        chargersetting: 'amp:6,psm:2,chargeStoped:0'
      });
      expect(result).toContain('●●●');
    });

    it('should handle threePhase as falsy (0)', () => {
      const result = formatChargerNextStatus({
        commandStop: 0,
        threePhase: 0,  // falsy number
        chargersetting: 'amp:6,psm:2,chargeStoped:0'
      });
      expect(result).toContain('● ');
      expect(result).not.toContain('●●●');
    });
  });
});
