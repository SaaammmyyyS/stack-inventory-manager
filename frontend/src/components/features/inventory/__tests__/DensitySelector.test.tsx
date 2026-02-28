import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DensitySelector from '@/components/features/inventory/DensitySelector';

describe('DensitySelector', () => {
  const mockOnDensityChange = vi.fn();

  beforeEach(() => {
    mockOnDensityChange.mockClear();
  });

  it('renders all three density options', () => {
    render(
      <DensitySelector
        density="comfortable"
        onDensityChange={mockOnDensityChange}
      />
    );

    expect(screen.getByRole('button', { name: /switch to compact density mode/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /switch to comfortable density mode/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /switch to spacious density mode/i })).toBeInTheDocument();
  });

  it('highlights the active density mode', () => {
    const { rerender } = render(
      <DensitySelector
        density="comfortable"
        onDensityChange={mockOnDensityChange}
      />
    );

    const comfortableButton = screen.getByRole('button', { name: /switch to comfortable density mode/i });
    const compactButton = screen.getByRole('button', { name: /switch to compact density mode/i });
    const spaciousButton = screen.getByRole('button', { name: /switch to spacious density mode/i });

    expect(comfortableButton).toHaveClass('bg-white');
    expect(compactButton).not.toHaveClass('bg-white');
    expect(spaciousButton).not.toHaveClass('bg-white');

    rerender(
      <DensitySelector
        density="compact"
        onDensityChange={mockOnDensityChange}
      />
    );

    expect(compactButton).toHaveClass('bg-white');
    expect(comfortableButton).not.toHaveClass('bg-white');
    expect(spaciousButton).not.toHaveClass('bg-white');
  });

  it('calls onDensityChange when compact button is clicked', () => {
    render(
      <DensitySelector
        density="comfortable"
        onDensityChange={mockOnDensityChange}
      />
    );

    const compactButton = screen.getByRole('button', { name: /switch to compact density mode/i });
    fireEvent.click(compactButton);

    expect(mockOnDensityChange).toHaveBeenCalledWith('compact');
    expect(mockOnDensityChange).toHaveBeenCalledTimes(1);
  });

  it('calls onDensityChange when comfortable button is clicked', () => {
    render(
      <DensitySelector
        density="compact"
        onDensityChange={mockOnDensityChange}
      />
    );

    const comfortableButton = screen.getByRole('button', { name: /switch to comfortable density mode/i });
    fireEvent.click(comfortableButton);

    expect(mockOnDensityChange).toHaveBeenCalledWith('comfortable');
    expect(mockOnDensityChange).toHaveBeenCalledTimes(1);
  });

  it('calls onDensityChange when spacious button is clicked', () => {
    render(
      <DensitySelector
        density="comfortable"
        onDensityChange={mockOnDensityChange}
      />
    );

    const spaciousButton = screen.getByRole('button', { name: /switch to spacious density mode/i });
    fireEvent.click(spaciousButton);

    expect(mockOnDensityChange).toHaveBeenCalledWith('spacious');
    expect(mockOnDensityChange).toHaveBeenCalledTimes(1);
  });

  it('displays correct labels and descriptions', () => {
    render(
      <DensitySelector
        density="comfortable"
        onDensityChange={mockOnDensityChange}
      />
    );

    expect(screen.getByText('Compact')).toBeInTheDocument();
    expect(screen.getByText('Comfortable')).toBeInTheDocument();
    expect(screen.getByText('Spacious')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <DensitySelector
        density="comfortable"
        onDensityChange={mockOnDensityChange}
      />
    );

    const compactButton = screen.getByRole('button', { name: /switch to compact density mode/i });
    const comfortableButton = screen.getByRole('button', { name: /switch to comfortable density mode/i });
    const spaciousButton = screen.getByRole('button', { name: /switch to spacious density mode/i });

    expect(compactButton).toHaveAttribute('aria-label', 'Switch to compact density mode');
    expect(comfortableButton).toHaveAttribute('aria-label', 'Switch to comfortable density mode');
    expect(spaciousButton).toHaveAttribute('aria-label', 'Switch to spacious density mode');
  });

  it('has proper title attributes with descriptions', () => {
    render(
      <DensitySelector
        density="comfortable"
        onDensityChange={mockOnDensityChange}
      />
    );

    const compactButton = screen.getByRole('button', { name: /switch to compact density mode/i });
    const comfortableButton = screen.getByRole('button', { name: /switch to comfortable density mode/i });
    const spaciousButton = screen.getByRole('button', { name: /switch to spacious density mode/i });

    expect(compactButton).toHaveAttribute('title', 'Compact: 25 items per page');
    expect(comfortableButton).toHaveAttribute('title', 'Comfortable: 10 items per page');
    expect(spaciousButton).toHaveAttribute('title', 'Spacious: 8 items per page');
  });

  it('applies correct styling classes', () => {
    render(
      <DensitySelector
        density="comfortable"
        onDensityChange={mockOnDensityChange}
      />
    );

    const container = screen.getByRole('button', { name: /switch to comfortable density mode/i }).parentElement;
    expect(container).toHaveClass('flex', 'bg-slate-100/50', 'p-1', 'rounded-2xl', 'border', 'border-slate-200');
  });

  it('shows item counts on small screens', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    render(
      <DensitySelector
        density="comfortable"
        onDensityChange={mockOnDensityChange}
      />
    );

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });
});
