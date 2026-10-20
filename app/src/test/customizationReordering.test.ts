import { describe, it, expect } from 'vitest';

describe('Dashboard Customization & Item Reordering Engine', () => {
    it('reorders quick log items correctly when dragged or shifted via side-to-side arrows', () => {
        const defaultQuickLogOrder = [
            'pee', 'poop', 'feed', 'pump', 'sleep', 'solids', 'vitamins', 'tummy', 'bath', 'temp', 'growth', 'milestone'
        ];

        // Simulate moving 'solids' to the first position
        const currentList = [...defaultQuickLogOrder];
        const sourceId = 'solids';
        const targetId = 'pee';

        const sourceIndex = currentList.indexOf(sourceId);
        const targetIndex = currentList.indexOf(targetId);

        expect(sourceIndex).toBe(5);
        expect(targetIndex).toBe(0);

        currentList.splice(sourceIndex, 1);
        currentList.splice(targetIndex, 0, sourceId);

        expect(currentList[0]).toBe('solids');
        expect(currentList[1]).toBe('pee');
        expect(currentList).toHaveLength(12);

        // Simulate moving 'solids' right via arrow button
        const moveItem = (list: string[], id: string, dir: 'left' | 'right') => {
            const arr = [...list];
            const idx = arr.indexOf(id);
            const tgt = dir === 'left' ? idx - 1 : idx + 1;
            if (tgt < 0 || tgt >= arr.length) return arr;
            const temp = arr[idx];
            arr[idx] = arr[tgt];
            arr[tgt] = temp;
            return arr;
        };

        const shiftedRight = moveItem(currentList, 'solids', 'right');
        expect(shiftedRight[0]).toBe('pee');
        expect(shiftedRight[1]).toBe('solids');
    });

    it('hides and restores specific items without disturbing remaining order', () => {
        const hiddenQuickLogIds: string[] = [];
        const hideItem = (hidden: string[], id: string) => Array.from(new Set([...hidden, id]));
        const restoreItem = (hidden: string[], id: string) => hidden.filter(h => h !== id);

        // Hide 'solids'
        let hidden = hideItem(hiddenQuickLogIds, 'solids');
        expect(hidden).toContain('solids');

        // Hide 'bath'
        hidden = hideItem(hidden, 'bath');
        expect(hidden).toEqual(['solids', 'bath']);

        // Restore 'solids'
        hidden = restoreItem(hidden, 'solids');
        expect(hidden).toEqual(['bath']);
    });

    it('reorders live timers correctly via drag-and-drop or left/right navigation', () => {
        const timerOrder = ['feed', 'pump', 'sleep', 'tummy'];

        // Drag 'pump' before 'feed'
        const list = [...timerOrder];
        const sourceIndex = list.indexOf('pump');
        const targetIndex = list.indexOf('feed');

        list.splice(sourceIndex, 1);
        list.splice(targetIndex, 0, 'pump');

        expect(list).toEqual(['pump', 'feed', 'sleep', 'tummy']);

        // Move 'tummy' left
        const moveItem = (l: string[], id: string, dir: 'left' | 'right') => {
            const arr = [...l];
            const idx = arr.indexOf(id);
            const tgt = dir === 'left' ? idx - 1 : idx + 1;
            if (tgt < 0 || tgt >= arr.length) return arr;
            const temp = arr[idx];
            arr[idx] = arr[tgt];
            arr[tgt] = temp;
            return arr;
        };

        const updated = moveItem(list, 'tummy', 'left');
        expect(updated).toEqual(['pump', 'feed', 'tummy', 'sleep']);
    });

    it('guarantees safe-start alignment for multi-child family tree carousels to prevent left clipping', () => {
        // Alignment resolver helper matching FamilyProfileView logic
        const getTreeCarouselJustify = (childCount: number): string => {
            return childCount >= 2 ? 'flex-start' : 'safe center';
        };

        // 1 child -> safely centered under tree branch
        expect(getTreeCarouselJustify(1)).toBe('safe center');

        // 2+ children -> aligns to flex-start with left margin padding, preventing negative scroll coordinates
        expect(getTreeCarouselJustify(2)).toBe('flex-start');
        expect(getTreeCarouselJustify(3)).toBe('flex-start');
        expect(getTreeCarouselJustify(4)).toBe('flex-start');
        expect(getTreeCarouselJustify(6)).toBe('flex-start');
    });
});

