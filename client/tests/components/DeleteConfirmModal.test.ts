// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import DeleteConfirmModal from '../../src/lib/components/DeleteConfirmModal.svelte';

describe('DeleteConfirmModal', () => {
  it('displays the wheel name in the confirmation message', () => {
    render(DeleteConfirmModal, {
      props: { wheelName: 'Food Wheel', onconfirm: vi.fn(), oncancel: vi.fn() },
    });

    expect(screen.getByText(/Food Wheel/)).toBeInTheDocument();
  });

  it('calls oncancel when the Cancel button is clicked', async () => {
    const oncancel = vi.fn();
    render(DeleteConfirmModal, {
      props: { wheelName: 'Food Wheel', onconfirm: vi.fn(), oncancel },
    });

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(oncancel).toHaveBeenCalledOnce();
  });

  it('calls onconfirm when the Delete button is clicked', async () => {
    const onconfirm = vi.fn();
    render(DeleteConfirmModal, {
      props: { wheelName: 'Food Wheel', onconfirm, oncancel: vi.fn() },
    });

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onconfirm).toHaveBeenCalledOnce();
  });

  it('calls oncancel when clicking the backdrop', async () => {
    const oncancel = vi.fn();
    render(DeleteConfirmModal, {
      props: { wheelName: 'Food Wheel', onconfirm: vi.fn(), oncancel },
    });

    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(oncancel).toHaveBeenCalledOnce();
  });

  it('renders the modal as a dialog role', () => {
    render(DeleteConfirmModal, {
      props: { wheelName: 'Food Wheel', onconfirm: vi.fn(), oncancel: vi.fn() },
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
