import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ActiveInventoryTable from '../ActiveInventoryTable';

describe('ActiveInventoryTable', () => {
  const mockInventory = [
    {
      id: '1',
      name: 'Test Product 1',
      sku: 'TEST-001',
      quantity: 100,
      price: 99.99,
      tenantId: 'test-tenant',
    },
    {
      id: '2',
      name: 'Test Product 2',
      sku: 'TEST-002',
      quantity: 50,
      price: 49.99,
      tenantId: 'test-tenant',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render inventory table with data', () => {
    const mockProps = {
      items: mockInventory,
      totalCount: 2,
      currentPage: 1,
      pageSize: 10,
      isAdmin: true,
      onPageChange: jest.fn(),
      onAdjust: jest.fn(),
      onHistory: jest.fn(),
      onDelete: jest.fn(),
      onEdit: jest.fn(),
    };

    render(<ActiveInventoryTable {...mockProps} />);

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('TEST-001')).toBeInTheDocument();
    expect(screen.getAllByText('General')).toHaveLength(2);

    const quantityDivs = document.querySelectorAll('[class*="rounded-2xl"]');
    expect(quantityDivs.length).toBeGreaterThan(0);

    const container = screen.getByText('Test Product 1').closest('tr');
    const quantityDiv = container?.querySelector('[class*="rounded-2xl"]');
    expect(quantityDiv?.textContent).toContain('100');
    expect(quantityDiv?.textContent).toContain('UNITS');

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getAllByTitle('Edit Details')).toHaveLength(2);
    expect(screen.getAllByTitle('Move to Trash')).toHaveLength(2);
  });

  it('should handle empty inventory state', async () => {
    const mockProps = {
      items: [],
      totalCount: 0,
      currentPage: 1,
      pageSize: 10,
      isAdmin: true,
      onPageChange: jest.fn(),
      onAdjust: jest.fn(),
      onHistory: jest.fn(),
      onDelete: jest.fn(),
      onEdit: jest.fn(),
    };

    render(<ActiveInventoryTable {...mockProps} />);

    expect(screen.getByText(/no matching records found/i)).toBeInTheDocument();
  });

  it('should open edit modal when edit button is clicked', async () => {
    const singleItem = [mockInventory[0]];

    const mockProps = {
      items: singleItem,
      totalCount: 1,
      currentPage: 1,
      pageSize: 10,
      isAdmin: true,
      onPageChange: jest.fn(),
      onAdjust: jest.fn(),
      onHistory: jest.fn(),
      onDelete: jest.fn(),
      onEdit: jest.fn(),
    };

    render(<ActiveInventoryTable {...mockProps} />);

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();

    const editButton = screen.getByTitle('Edit Details');
    await userEvent.click(editButton);

    expect(mockProps.onEdit).toHaveBeenCalledWith(mockInventory[0]);
  });

  it('should open delete confirmation when delete button is clicked', async () => {
    const singleItem = [mockInventory[0]];

    const mockProps = {
      items: singleItem,
      totalCount: 1,
      currentPage: 1,
      pageSize: 10,
      isAdmin: true,
      onPageChange: jest.fn(),
      onAdjust: jest.fn(),
      onHistory: jest.fn(),
      onDelete: jest.fn(),
      onEdit: jest.fn(),
    };

    render(<ActiveInventoryTable {...mockProps} />);

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();

    const deleteButton = screen.getByTitle('Move to Trash');
    await userEvent.click(deleteButton);

    expect(mockProps.onDelete).toHaveBeenCalledWith('1', 'Test Product 1');
  });

  it('should handle pagination', async () => {
    const mockProps = {
      items: [mockInventory[0]],
      totalCount: 2,
      currentPage: 1,
      pageSize: 1,
      isAdmin: true,
      onPageChange: jest.fn(),
      onAdjust: jest.fn(),
      onHistory: jest.fn(),
      onDelete: jest.fn(),
      onEdit: jest.fn(),
    };

    render(<ActiveInventoryTable {...mockProps} />);

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    const nextPageButton = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextPageButton);

    expect(mockProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('should handle stock adjustment buttons', async () => {
    const singleItem = [mockInventory[0]];

    const mockProps = {
      items: singleItem,
      totalCount: 1,
      currentPage: 1,
      pageSize: 10,
      isAdmin: true,
      onPageChange: jest.fn(),
      onAdjust: jest.fn(),
      onHistory: jest.fn(),
      onDelete: jest.fn(),
      onEdit: jest.fn(),
    };

    render(<ActiveInventoryTable {...mockProps} />);

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();

    const stockButtons = screen.getAllByRole('button');
    const minusButton = stockButtons.find(btn => btn.querySelector('.lucide-minus'));
    const plusButton = stockButtons.find(btn => btn.querySelector('.lucide-plus'));

    expect(minusButton).toBeInTheDocument();
    expect(plusButton).toBeInTheDocument();

    if (minusButton) {
      await userEvent.click(minusButton);
      expect(mockProps.onAdjust).toHaveBeenCalledWith('1', 'Test Product 1', 'STOCK_OUT');
    }

    if (plusButton) {
      await userEvent.click(plusButton);
      expect(mockProps.onAdjust).toHaveBeenCalledWith('1', 'Test Product 1', 'STOCK_IN');
    }
  });

  it('should handle history button click', async () => {
    const singleItem = [mockInventory[0]];

    const mockProps = {
      items: singleItem,
      totalCount: 1,
      currentPage: 1,
      pageSize: 10,
      isAdmin: true,
      onPageChange: jest.fn(),
      onAdjust: jest.fn(),
      onHistory: jest.fn(),
      onDelete: jest.fn(),
      onEdit: jest.fn(),
    };

    render(<ActiveInventoryTable {...mockProps} />);

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();

    const historyButton = screen.getByTitle('View History');
    await userEvent.click(historyButton);

    expect(mockProps.onHistory).toHaveBeenCalledWith('1', 'Test Product 1');
  });

  it('should display correct pagination info', () => {
    const mockProps = {
      items: mockInventory,
      totalCount: 2,
      currentPage: 1,
      pageSize: 10,
      isAdmin: true,
      onPageChange: jest.fn(),
      onAdjust: jest.fn(),
      onHistory: jest.fn(),
      onDelete: jest.fn(),
      onEdit: jest.fn(),
    };

    render(<ActiveInventoryTable {...mockProps} />);

    expect(screen.getByText(/showing/i)).toBeInTheDocument();
    expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();

    const prevButton = screen.getByRole('button', { name: /prev/i });
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });
});
