// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ResultModal from './ResultModal.svelte';
import type { Segment, ProvablyFairResult } from '../types.js';

const winningSegment: Segment = { id: '1', text: 'Pizza', color: '#EF4444' };

const pfResult: ProvablyFairResult = {
  serverSeed: 'server-seed-value',
  serverSeedHash: 'a'.repeat(64),
  clientSeed: 'client-seed-value',
  nonce: 1,
  resultIndex: 2,
};

describe('ResultModal', () => {
  it('renders the winning segment text', () => {
    render(ResultModal, {
      props: {
        winningSegment,
        pfResult: null,
        pfVerifying: false,
        pfVerifyResult: null,
        onclose: vi.fn(),
        onverify: vi.fn(),
      },
    });

    expect(screen.getByText('Pizza')).toBeInTheDocument();
  });

  it('calls onclose when CLOSE button is clicked', async () => {
    const onclose = vi.fn();
    render(ResultModal, {
      props: {
        winningSegment,
        pfResult: null,
        pfVerifying: false,
        pfVerifyResult: null,
        onclose,
        onverify: vi.fn(),
      },
    });

    // Use exact text to avoid matching the "Close modal" aria-label on the backdrop
    await userEvent.click(screen.getByText('CLOSE'));
    expect(onclose).toHaveBeenCalledOnce();
  });

  it('calls onclose when clicking the backdrop', async () => {
    const onclose = vi.fn();
    render(ResultModal, {
      props: {
        winningSegment,
        pfResult: null,
        pfVerifying: false,
        pfVerifyResult: null,
        onclose,
        onverify: vi.fn(),
      },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onclose).toHaveBeenCalledOnce();
  });

  it('does not show the Provably Fair section when pfResult is null', () => {
    render(ResultModal, {
      props: {
        winningSegment,
        pfResult: null,
        pfVerifying: false,
        pfVerifyResult: null,
        onclose: vi.fn(),
        onverify: vi.fn(),
      },
    });

    expect(screen.queryByText(/provably fair/i)).not.toBeInTheDocument();
  });

  it('shows the Provably Fair toggle button when pfResult is provided', () => {
    render(ResultModal, {
      props: {
        winningSegment,
        pfResult,
        pfVerifying: false,
        pfVerifyResult: null,
        onclose: vi.fn(),
        onverify: vi.fn(),
      },
    });

    expect(screen.getByRole('button', { name: /provably fair/i })).toBeInTheDocument();
  });

  it('reveals PF details when the toggle is clicked', async () => {
    render(ResultModal, {
      props: {
        winningSegment,
        pfResult,
        pfVerifying: false,
        pfVerifyResult: null,
        onclose: vi.fn(),
        onverify: vi.fn(),
      },
    });

    await userEvent.click(screen.getByRole('button', { name: /provably fair/i }));
    expect(screen.getByText('server-seed-value')).toBeInTheDocument();
    expect(screen.getByText('client-seed-value')).toBeInTheDocument();
  });

  it('calls onverify when Verify on server is clicked', async () => {
    const onverify = vi.fn();
    render(ResultModal, {
      props: {
        winningSegment,
        pfResult,
        pfVerifying: false,
        pfVerifyResult: null,
        onclose: vi.fn(),
        onverify,
      },
    });

    await userEvent.click(screen.getByRole('button', { name: /provably fair/i }));
    await userEvent.click(screen.getByRole('button', { name: /verify on server/i }));
    expect(onverify).toHaveBeenCalledOnce();
  });

  it('shows a loading spinner and no "Verify" text when pfVerifying is true', async () => {
    render(ResultModal, {
      props: {
        winningSegment,
        pfResult,
        pfVerifying: true,
        pfVerifyResult: null,
        onclose: vi.fn(),
        onverify: vi.fn(),
      },
    });

    await userEvent.click(screen.getByRole('button', { name: /provably fair/i }));
    // The spinner replaces the button text when verifying
    expect(document.querySelector('.loading-spinner')).not.toBeNull();
    expect(screen.queryByText(/verify on server/i)).not.toBeInTheDocument();
  });

  it('shows a success message when pfVerifyResult.valid is true', async () => {
    render(ResultModal, {
      props: {
        winningSegment,
        pfResult,
        pfVerifying: false,
        pfVerifyResult: { valid: true },
        onclose: vi.fn(),
        onverify: vi.fn(),
      },
    });

    await userEvent.click(screen.getByRole('button', { name: /provably fair/i }));
    expect(screen.getByText(/this spin is provably fair/i)).toBeInTheDocument();
  });

  it('shows an error message when pfVerifyResult.valid is false', async () => {
    render(ResultModal, {
      props: {
        winningSegment,
        pfResult,
        pfVerifying: false,
        pfVerifyResult: { valid: false, error: 'Verification request failed.' },
        onclose: vi.fn(),
        onverify: vi.fn(),
      },
    });

    await userEvent.click(screen.getByRole('button', { name: /provably fair/i }));
    expect(screen.getByText('Verification request failed.')).toBeInTheDocument();
  });
});
