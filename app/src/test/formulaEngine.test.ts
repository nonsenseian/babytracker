import { describe, it, expect } from 'vitest';
import {
    calculateFormulaMix,
    formatTsp,
    formatKitchenBreakdown,
    formatScoops,
    FORMULA_PRESETS
} from '../engines/formulaEngine';

describe('Formula & Water Ratio Calculator Engine', () => {
    it('calculates standard US formula ratio (3 tsp per 2 oz)', () => {
        // 2 oz water should require 3 tsp (1 scoop)
        const res2 = calculateFormulaMix(2, 'oz', 3, 2, 'oz', 3);
        expect(res2.requiredTsp).toBe(3);
        expect(res2.requiredTspFormatted).toBe('3 tsp');
        expect(res2.scoopsEquivalent).toBe(1);
        expect(res2.kitchenBreakdown).toBe('1 tablespoon (tbsp)');

        // 4 oz water should require 6 tsp (2 scoops / 2 tbsp)
        const res4 = calculateFormulaMix(4, 'oz', 3, 2, 'oz', 3);
        expect(res4.requiredTsp).toBe(6);
        expect(res4.requiredTspFormatted).toBe('6 tsp');
        expect(res4.scoopsEquivalent).toBe(2);
        expect(res4.kitchenBreakdown).toBe('2 tablespoons (tbsp)');

        // 1 oz water should require 1.5 tsp (½ scoop)
        const res1 = calculateFormulaMix(1, 'oz', 3, 2, 'oz', 3);
        expect(res1.requiredTsp).toBe(1.5);
        expect(res1.requiredTspFormatted).toBe('1½ tsp');
        expect(res1.scoopsEquivalent).toBe(0.5);

        // 3 oz water should require 4.5 tsp (1 tbsp + 1½ tsp)
        const res3 = calculateFormulaMix(3, 'oz', 3, 2, 'oz', 3);
        expect(res3.requiredTsp).toBe(4.5);
        expect(res3.requiredTspFormatted).toBe('4½ tsp');
        expect(res3.scoopsEquivalent).toBe(1.5);
        expect(res3.kitchenBreakdown).toBe('1 tablespoon (tbsp) + 1½ tsp');
    });

    it('calculates European / Kendamil formula ratio (3 tsp per 1 oz)', () => {
        // 3 oz water should require 9 tsp (3 scoops / 3 tbsp)
        const res = calculateFormulaMix(3, 'oz', 3, 1, 'oz', 3);
        expect(res.requiredTsp).toBe(9);
        expect(res.kitchenBreakdown).toBe('3 tablespoons (tbsp)');
        expect(res.scoopsEquivalent).toBe(3);
    });

    it('calculates Fortified 22 kcal formula ratio (3.5 tsp per 2 oz)', () => {
        // 4 oz water should require 7 tsp
        const res = calculateFormulaMix(4, 'oz', 3.5, 2, 'oz', 3);
        expect(res.requiredTsp).toBe(7);
        expect(res.kitchenBreakdown).toBe('2 tablespoons (tbsp) + 1 tsp');
    });

    it('calculates Fortified 24 kcal formula ratio (4 tsp per 2 oz)', () => {
        // 4 oz water should require 8 tsp
        const res = calculateFormulaMix(4, 'oz', 4, 2, 'oz', 3);
        expect(res.requiredTsp).toBe(8);
        expect(res.kitchenBreakdown).toBe('2 tablespoons (tbsp) + 2 tsp');
    });

    it('correctly converts metric mL water volume to match oz ratio', () => {
        // 120 mL = 4 oz, with 3 tsp / 2 oz ratio -> 6 tsp
        const res = calculateFormulaMix(120, 'ml', 3, 2, 'oz', 3);
        expect(res.requiredTsp).toBe(6);
        expect(res.scoopsEquivalent).toBe(2);

        // 60 mL = 2 oz -> 3 tsp
        const res60 = calculateFormulaMix(60, 'ml', 3, 2, 'oz', 3);
        expect(res60.requiredTsp).toBe(3);
    });

    it('handles zero, negative, and NaN inputs gracefully without crashing', () => {
        const resZero = calculateFormulaMix(0, 'oz', 3, 2, 'oz');
        expect(resZero.requiredTsp).toBe(0);
        expect(resZero.requiredTspFormatted).toBe('0 tsp');

        const resNaN = calculateFormulaMix(NaN, 'oz', 3, 2, 'oz');
        expect(resNaN.requiredTsp).toBe(0);

        const resNeg = calculateFormulaMix(-5, 'oz', 3, 2, 'oz');
        expect(resNeg.requiredTsp).toBe(0);
    });

    it('formats fractions, scoops, and kitchen measurements accurately', () => {
        expect(formatTsp(0.5)).toBe('½ tsp');
        expect(formatTsp(0.25)).toBe('¼ tsp');
        expect(formatTsp(0.75)).toBe('¾ tsp');
        expect(formatTsp(2.5)).toBe('2½ tsp');
        expect(formatScoops(1)).toBe('1 scoop');
        expect(formatScoops(2.5)).toBe('2½ scoops');
        expect(formatKitchenBreakdown(6)).toBe('2 tablespoons (tbsp)');
        expect(formatKitchenBreakdown(4.5)).toBe('1 tablespoon (tbsp) + 1½ tsp');
        expect(formatKitchenBreakdown(1.5)).toBe('1½ tsp');
    });

    it('has all standard presets defined', () => {
        expect(FORMULA_PRESETS.length).toBeGreaterThanOrEqual(5);
        expect(FORMULA_PRESETS.some(p => p.id === 'standard-us')).toBe(true);
        expect(FORMULA_PRESETS.some(p => p.id === 'european-kendamil')).toBe(true);
        expect(FORMULA_PRESETS.some(p => p.id === 'custom')).toBe(true);
    });
});
