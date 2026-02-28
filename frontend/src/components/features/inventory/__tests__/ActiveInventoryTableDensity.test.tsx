import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ActiveInventoryTable from '@/components/features/inventory/ActiveInventoryTable';
import type { InventoryItem } from '@/hooks/useInventory';

const mockItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Test Product 1',
    quantity: 10,
    tenantId: 'tenant-1',
    sku: 'SKU001',
    category: 'Electronics',
    price: 100,
    minThreshold: 5
  },
  {
    id: '2',
    name: 'Test Product 2',
    quantity: 3,
    tenantId: 'tenant-1',
    sku: 'SKU002',
    category: 'Furniture',
    price: 200,
    minThreshold: 5
  }
];

const defaultProps = {
  items: mockItems,
  totalCount: 2,
  currentPage: 1,
  pageSize: 10,
  isAdmin: true,
  onPageChange: vi.fn(),
  onAdjust: vi.fn(),
  onHistory: vi.fn(),
  onDelete: vi.fn(),
  onEdit: vi.fn()
};

describe('ActiveInventoryTable Density Styling', () => {
  it('applies compact density styling', () => {
    render(<ActiveInventoryTable {...defaultProps} density="compact" />);

    const tableRows = screen.getAllByRole('row');
    expect(tableRows[1]).toHaveClass('py-2');

    const productName = screen.getByText('Test Product 1');
    expect(productName).toHaveClass('text-sm');

    const skuBadge = screen.getByText('SKU001');
    expect(skuBadge).toHaveClass('text-[8px]', 'px-1', 'py-0.5');

    const stockDisplay = screen.getByText('10 UNITS');
    expect(stockDisplay).toHaveClass('px-3', 'py-1.5', 'text-[10px]', 'min-w-[100px]');

    const buttons = screen.getAllByRole('button');
    const stockButtons = buttons.filter(btn =>
      btn.querySelector('svg') && btn.closest('td')?.querySelector('.text-orange-500, .text-blue-500')
    );
    expect(stockButtons[0]).toHaveClass('p-1.5');
  });

  it('applies comfortable density styling', () => {
    render(<ActiveInventoryTable {...defaultProps} density="comfortable" />);

    const tableRows = screen.getAllByRole('row');
    expect(tableRows[1]).toHaveClass('py-5');

    const productName = screen.getByText('Test Product 1');
    expect(productName).toHaveClass('text-lg');

    const skuBadge = screen.getByText('SKU001');
    expect(skuBadge).toHaveClass('text-[9px]', 'px-1.5', 'py-0.5');

    const stockDisplay = screen.getByText('10 UNITS');
    expect(stockDisplay).toHaveClass('px-5', 'py-2.5', 'text-[11px]', 'min-w-[120px]');

    const buttons = screen.getAllByRole('button');
    const stockButtons = buttons.filter(btn =>
      btn.querySelector('svg') && btn.closest('td')?.querySelector('.text-orange-500, .text-blue-500')
    );
    expect(stockButtons[0]).toHaveClass('p-2');
  });

  it('applies spacious density styling', () => {
    render(<ActiveInventoryTable {...defaultProps} density="spacious" />);

    const tableRows = screen.getAllByRole('row');
    expect(tableRows[1]).toHaveClass('py-6');

    const productName = screen.getByText('Test Product 1');
    expect(productName).toHaveClass('text-xl');

    const skuBadge = screen.getByText('SKU001');
    expect(skuBadge).toHaveClass('text-[10px]', 'px-2', 'py-1');

    const stockDisplay = screen.getByText('10 UNITS');
    expect(stockDisplay).toHaveClass('px-6', 'py-3', 'text-[12px]', 'min-w-[140px]');

    const buttons = screen.getAllByRole('button');
    const stockButtons = buttons.filter(btn =>
      btn.querySelector('svg') && btn.closest('td')?.querySelector('.text-orange-500, .text-blue-500')
    );
    expect(stockButtons[0]).toHaveClass('p-2.5');
  });

  it('uses comfortable styling as default', () => {
    render(<ActiveInventoryTable {...defaultProps} />);

    const tableRows = screen.getAllByRole('row');
    expect(tableRows[1]).toHaveClass('py-5');

    const productName = screen.getByText('Test Product 1');
    expect(productName).toHaveClass('text-lg');
  });

  it('applies density styling to action buttons', () => {
    render(<ActiveInventoryTable {...defaultProps} density="compact" />);

    const actionButtons = screen.getAllByTitle(/Edit Details|View History|Move to Trash/);
    expect(actionButtons[0]).toHaveClass('p-2');

    render(<ActiveInventoryTable {...defaultProps} density="spacious" />);

    const spaciousActionButtons = screen.getAllByTitle(/Edit Details|View History|Move to Trash/);
    expect(spaciousActionButtons[0]).toHaveClass('p-3');
  });

  it('adjusts icon sizes based on density', () => {
    const { rerender } = render(<ActiveInventoryTable {...defaultProps} density="compact" />);

    const compactIcons = screen.getAllByRole('button').map(btn => btn.querySelector('svg'));
    const compactIcon = compactIcons.find(icon => icon?.closest('button')?.classList.contains('p-1.5'));
    expect(compactIcon?.getAttribute('width')).toBe('14');

    rerender(<ActiveInventoryTable {...defaultProps} density="spacious" />);

    const spaciousIcons = screen.getAllByRole('button').map(btn => btn.querySelector('svg'));
    const spaciousIcon = spaciousIcons.find(icon => icon?.closest('button')?.classList.contains('p-2.5'));
    expect(spaciousIcon?.getAttribute('width')).toBe('18');
  });

  it('maintains functionality across all density modes', () => {
    const mockOnEdit = vi.fn();
    const mockOnHistory = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnAdjust = vi.fn();

    const propsWithMocks = {
      ...defaultProps,
      onEdit: mockOnEdit,
      onHistory: mockOnHistory,
      onDelete: mockOnDelete,
      onAdjust: mockOnAdjust
    };

    const { rerender } = render(<ActiveInventoryTable {...propsWithMocks} density="compact" />);

    const editButton = screen.getByTitle('Edit Details');
    const historyButton = screen.getByTitle('View History');
    const deleteButton = screen.getByTitle('Move to Trash');

    expect(editButton).toBeInTheDocument();
    expect(historyButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();

    rerender(<ActiveInventoryTable {...propsWithMocks} density="spacious" />);

    expect(screen.getByTitle('Edit Details')).toBeInTheDocument();
    expect(screen.getByTitle('View History')).toBeInTheDocument();
    expect(screen.getByTitle('Move to Trash')).toBeInTheDocument();
  });

  it('applies density styling consistently across all rows', () => {
    render(<ActiveInventoryTable {...defaultProps} density="compact" />);

    const tableRows = screen.getAllByRole('row');
    const dataRows = tableRows.slice(1);

    dataRows.forEach(row => {
      expect(row).toHaveClass('py-2');
    });

    const productNames = screen.getAllByText(/Test Product/);
    productNames.forEach(name => {
      expect(name).toHaveClass('text-sm');
    });
  });
});
