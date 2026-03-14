// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SpinHistoryTable from '../../src/lib/components/SpinHistoryTable.svelte';
import type { SpinLog } from '../../src/lib/types.js';

const makeLog = (overrides: Partial<SpinLog> = {}): SpinLog => ({
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  wheelName: 'Food Wheel',
  segmentText: 'Pizza',
  segmentColor: '#EF4444',
  ...overrides,
});

describe('SpinHistoryTable', () => {
  it('shows the empty state when there are no logs', () => {
    render(SpinHistoryTable, { props: { spinLogs: [], onclear: vi.fn() } });
    expect(screen.getByText(/no spins yet/i)).toBeInTheDocument();
  });

  it('does not show the Clear button when logs are empty', () => {
    render(SpinHistoryTable, { props: { spinLogs: [], onclear: vi.fn() } });
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('renders each log entry with segment text and wheel name', () => {
    const logs = [
      makeLog({ segmentText: 'Burger', wheelName: 'Food Wheel' }),
      makeLog({ segmentText: 'Sushi', wheelName: 'Asia Wheel' }),
    ];
    render(SpinHistoryTable, { props: { spinLogs: logs, onclear: vi.fn() } });

    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('Sushi')).toBeInTheDocument();
    expect(screen.getByText('Food Wheel')).toBeInTheDocument();
    expect(screen.getByText('Asia Wheel')).toBeInTheDocument();
  });

  it('shows a provably-fair shield icon for PF spins', () => {
    const pfResult = {
      serverSeed: 'seed',
      serverSeedHash: 'hash',
      clientSeed: 'client',
      nonce: 0,
      resultIndex: 0,
    };
    const logs = [makeLog({ provablyFair: pfResult })];
    render(SpinHistoryTable, { props: { spinLogs: logs, onclear: vi.fn() } });

    // The shield SVG has a title attribute set on its parent span
    expect(screen.getByTitle('Provably fair spin')).toBeInTheDocument();
  });

  it('shows a dash for non-PF spins', () => {
    const logs = [makeLog({ provablyFair: undefined })];
    render(SpinHistoryTable, { props: { spinLogs: logs, onclear: vi.fn() } });

    expect(screen.getByTitle('Client-side random')).toBeInTheDocument();
  });

  it('shows the Clear button when there are logs', () => {
    const logs = [makeLog()];
    render(SpinHistoryTable, { props: { spinLogs: logs, onclear: vi.fn() } });

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('calls onclear when the Clear button is clicked', async () => {
    const onclear = vi.fn();
    const logs = [makeLog()];
    render(SpinHistoryTable, { props: { spinLogs: logs, onclear } });

    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onclear).toHaveBeenCalledOnce();
  });

  it('displays the count badge when there are logs', () => {
    const logs = [makeLog(), makeLog(), makeLog()];
    render(SpinHistoryTable, { props: { spinLogs: logs, onclear: vi.fn() } });

    // Use within to scope to the badge specifically (avoid matching row numbers)
    const badge = document.querySelector('.badge.badge-primary');
    expect(badge).not.toBeNull();
    expect(within(badge as HTMLElement).getByText('3')).toBeInTheDocument();
  });
});
