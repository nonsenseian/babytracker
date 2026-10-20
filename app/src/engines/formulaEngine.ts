/**
 * Formula & Water Ratio Calculator Engine
 * Handles accurate pediatric formula powder mix to water volume conversions in teaspoons (tsp),
 * tablespoons, and scoops, with support for US, European, and custom fortified ratios.
 */

export type WaterUnit = 'oz' | 'ml';

export interface FormulaRatioPreset {
    id: string;
    name: string;
    description: string;
    mixTsp: number;        // Teaspoons of formula powder mix
    waterVolume: number;   // Volume of water
    waterUnit: WaterUnit;  // Unit of water ('oz' or 'ml')
    scoopTsp: number;      // Teaspoons per 1 manufacturer scoop (default 3 tsp = 1 tbsp = ~8.5g)
    isCustom?: boolean;
}

export const FORMULA_PRESETS: FormulaRatioPreset[] = [
    {
        id: 'standard-us',
        name: 'Standard US (Similac / Enfamil / Gerber)',
        description: '1 scoop (3 tsp) per 2 fl oz (60 mL) water • ~20 kcal/oz',
        mixTsp: 3,
        waterVolume: 2,
        waterUnit: 'oz',
        scoopTsp: 3
    },
    {
        id: 'european-kendamil',
        name: 'European / Kendamil / Aptamil / Hipp',
        description: '1 scoop (3 tsp) per 1 fl oz (30 mL) water • ~20 kcal/oz',
        mixTsp: 3,
        waterVolume: 1,
        waterUnit: 'oz',
        scoopTsp: 3
    },
    {
        id: 'fortified-22',
        name: 'Fortified 22 kcal (NICU / Pediatric Growth)',
        description: '3.5 tsp powder per 2 fl oz water • Calorie enriched',
        mixTsp: 3.5,
        waterVolume: 2,
        waterUnit: 'oz',
        scoopTsp: 3
    },
    {
        id: 'fortified-24',
        name: 'Fortified 24 kcal (High Calorie Prescription)',
        description: '4.0 tsp powder per 2 fl oz water • High calorie density',
        mixTsp: 4,
        waterVolume: 2,
        waterUnit: 'oz',
        scoopTsp: 3
    },
    {
        id: 'custom',
        name: 'Custom Brand / Doctor Recipe',
        description: 'Enter your custom teaspoons and water volume ratio',
        mixTsp: 3,
        waterVolume: 2,
        waterUnit: 'oz',
        scoopTsp: 3,
        isCustom: true
    }
];

export interface FormulaCalculationResult {
    waterVolume: number;
    waterUnit: WaterUnit;
    requiredTsp: number;
    requiredTspFormatted: string;
    kitchenBreakdown: string;
    scoopsEquivalent: number;
    scoopsFormatted: string;
    preparedVolumeOz: number;
    preparedVolumeMl: number;
    ratioDescription: string;
}

/**
 * Standard conversion factor: 1 fl oz = 30 mL for commercial baby bottles
 */
export const ML_PER_FL_OZ = 30;

/**
 * Converts water volume into the ratio's native unit
 */
export function normalizeWaterVolume(
    inputVolume: number,
    inputUnit: WaterUnit,
    targetUnit: WaterUnit
): number {
    if (inputUnit === targetUnit) return inputVolume;
    if (inputUnit === 'ml' && targetUnit === 'oz') {
        return inputVolume / ML_PER_FL_OZ;
    }
    // inputUnit === 'oz' && targetUnit === 'ml'
    return inputVolume * ML_PER_FL_OZ;
}

/**
 * Calculates exact teaspoons of formula mix for a given water volume and ratio
 */
export function calculateFormulaMix(
    waterVolume: number,
    waterUnit: WaterUnit,
    ratioMixTsp: number,
    ratioWaterVolume: number,
    ratioWaterUnit: WaterUnit,
    scoopTsp: number = 3
): FormulaCalculationResult {
    const validWater = Math.max(0, isNaN(waterVolume) ? 0 : waterVolume);
    const validRatioMix = Math.max(0.1, isNaN(ratioMixTsp) ? 3 : ratioMixTsp);
    const validRatioWater = Math.max(0.1, isNaN(ratioWaterVolume) ? 2 : ratioWaterVolume);
    const validScoopTsp = Math.max(0.5, isNaN(scoopTsp) ? 3 : scoopTsp);

    // Normalize water volume to the ratio's unit
    const waterInRatioUnit = normalizeWaterVolume(validWater, waterUnit, ratioWaterUnit);
    const multiplier = waterInRatioUnit / validRatioWater;
    const requiredTsp = multiplier * validRatioMix;

    // Prepared feed volume estimation: powder adds ~10% volume
    const waterInOz = waterUnit === 'oz' ? validWater : validWater / ML_PER_FL_OZ;
    const preparedVolumeOz = Math.round((waterInOz * 1.1) * 10) / 10;
    const preparedVolumeMl = Math.round(preparedVolumeOz * ML_PER_FL_OZ);

    const scoops = requiredTsp / validScoopTsp;

    return {
        waterVolume: validWater,
        waterUnit,
        requiredTsp: Math.round(requiredTsp * 100) / 100,
        requiredTspFormatted: formatTsp(requiredTsp),
        kitchenBreakdown: formatKitchenBreakdown(requiredTsp),
        scoopsEquivalent: Math.round(scoops * 10) / 10,
        scoopsFormatted: formatScoops(scoops),
        preparedVolumeOz,
        preparedVolumeMl,
        ratioDescription: `${validRatioMix} tsp mix per ${validRatioWater} ${ratioWaterUnit}`
    };
}

/**
 * Converts a numeric teaspoon value to a friendly string with Unicode fractions
 */
export function formatTsp(tsp: number): string {
    if (tsp <= 0) return '0 tsp';
    const rounded = Math.round(tsp * 100) / 100;
    const whole = Math.floor(rounded);
    const fraction = rounded - whole;

    let fracStr = '';
    if (Math.abs(fraction - 0.5) < 0.08) fracStr = '½';
    else if (Math.abs(fraction - 0.25) < 0.08) fracStr = '¼';
    else if (Math.abs(fraction - 0.75) < 0.08) fracStr = '¾';
    else if (Math.abs(fraction - 0.33) < 0.08) fracStr = '⅓';
    else if (Math.abs(fraction - 0.67) < 0.08) fracStr = '⅔';
    else if (Math.abs(fraction - 0.125) < 0.05) fracStr = '⅛';

    if (whole === 0) {
        return fracStr ? `${fracStr} tsp` : `${rounded.toFixed(1)} tsp`;
    }
    if (fracStr) {
        return `${whole}${fracStr} tsp`;
    }
    return rounded % 1 === 0 ? `${whole} tsp` : `${rounded.toFixed(1)} tsp`;
}

/**
 * Formats teaspoons into practical kitchen spoon breakdown (e.g., "1 tbsp + 1½ tsp")
 */
export function formatKitchenBreakdown(totalTsp: number): string {
    if (totalTsp <= 0) return '0 tsp';
    const rounded = Math.round(totalTsp * 10) / 10;
    const tbsp = Math.floor(rounded / 3);
    const remTsp = Math.round((rounded % 3) * 10) / 10;

    if (tbsp === 0) {
        return formatTsp(remTsp);
    }

    const tbspLabel = tbsp === 1 ? '1 tablespoon (tbsp)' : `${tbsp} tablespoons (tbsp)`;
    if (remTsp <= 0.1) {
        return tbspLabel;
    }

    return `${tbspLabel} + ${formatTsp(remTsp)}`;
}

/**
 * Formats scoop equivalent count
 */
export function formatScoops(scoops: number): string {
    if (scoops <= 0) return '0 scoops';
    const rounded = Math.round(scoops * 10) / 10;
    const whole = Math.floor(rounded);
    const frac = rounded - whole;

    let fracStr = '';
    if (Math.abs(frac - 0.5) < 0.08) fracStr = '½';
    else if (Math.abs(frac - 0.25) < 0.08) fracStr = '¼';
    else if (Math.abs(frac - 0.75) < 0.08) fracStr = '¾';

    if (whole === 0 && fracStr) return `${fracStr} scoop`;
    if (fracStr) return `${whole}${fracStr} scoops`;
    return rounded === 1 ? '1 scoop' : `${rounded} scoops`;
}
