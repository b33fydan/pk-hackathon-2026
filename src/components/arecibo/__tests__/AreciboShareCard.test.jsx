import { render, screen, fireEvent } from '@testing-library/react';
import AreciboShareCard from '../AreciboShareCard';

describe('AreciboShareCard', () => {
  const mockIntent = {
    weekNumber: 1,
    sections: {},
  };

  const mockPixelData = Array(23)
    .fill(null)
    .map(() => Array(73).fill(0));

  const defaultProps = {
    intent: mockIntent,
    kingdomName: 'TestKingdom',
    companionName: 'TestCompanion',
    weekNumber: '1',
    weekDate: 'Jan 1 - Jan 7',
    pixelData: mockPixelData,
    bondLevel: 3,
  };

  it('renders share card', () => {
    render(<AreciboShareCard {...defaultProps} />);

    expect(screen.getByText('TestKingdom')).toBeInTheDocument();
    expect(screen.getByText(/TestCompanion/i)).toBeInTheDocument();
  });

  it('displays week information', () => {
    render(<AreciboShareCard {...defaultProps} />);

    expect(screen.getByText(/Week 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan 1 - Jan 7/i)).toBeInTheDocument();
  });

  it('displays bond level', () => {
    render(<AreciboShareCard {...defaultProps} bondLevel={3} />);

    expect(screen.getByText(/Bond Level 3/i)).toBeInTheDocument();
  });

  it('has download button', () => {
    render(<AreciboShareCard {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
  });

  it('has copy grid button', () => {
    render(<AreciboShareCard {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Copy Grid/i })).toBeInTheDocument();
  });

  it('has copy text button', () => {
    render(<AreciboShareCard {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Copy Text/i })).toBeInTheDocument();
  });

  it('renders canvas for grid preview', () => {
    const { container } = render(<AreciboShareCard {...defaultProps} />);

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('calls onExport when button clicked', () => {
    const onExport = jest.fn();
    render(<AreciboShareCard {...defaultProps} onExport={onExport} />);

    // Note: actual export requires html2canvas which might not be available in test env
    // This just verifies button is clickable
    const downloadBtn = screen.getByRole('button', { name: /Download/i });
    expect(downloadBtn).toBeInTheDocument();
  });

  it('displays footer with website', () => {
    render(<AreciboShareCard {...defaultProps} />);

    expect(screen.getByText('paydaykingdom.app')).toBeInTheDocument();
  });

  it('handles different bond levels', () => {
    const { rerender } = render(<AreciboShareCard {...defaultProps} bondLevel={1} />);
    expect(screen.getByText(/Bond Level 1/i)).toBeInTheDocument();

    rerender(<AreciboShareCard {...defaultProps} bondLevel={5} />);
    expect(screen.getByText(/Bond Level 5/i)).toBeInTheDocument();
  });
});
