import { render, screen, fireEvent } from '@testing-library/react';
import AreciboGrid from '../AreciboGrid';

describe('AreciboGrid', () => {
  const mockPixelData = Array(23)
    .fill(null)
    .map(() => Array(73).fill(0));

  it('renders canvas element', () => {
    const { container } = render(
      <AreciboGrid pixelData={mockPixelData} onSectionClick={jest.fn()} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('sets correct canvas dimensions', () => {
    const { container } = render(
      <AreciboGrid pixelData={mockPixelData} onSectionClick={jest.fn()} scale={4} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas.width).toBe(73 * 4);
    expect(canvas.height).toBe(23 * 4);
  });

  it('respects custom scale prop', () => {
    const { container } = render(
      <AreciboGrid pixelData={mockPixelData} onSectionClick={jest.fn()} scale={2} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas.width).toBe(73 * 2);
  });

  it('calls onSectionClick when section is clicked', () => {
    const onSectionClick = jest.fn();
    const { container } = render(
      <AreciboGrid pixelData={mockPixelData} onSectionClick={onSectionClick} scale={4} />
    );

    const buttons = container.querySelectorAll('button');
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      expect(onSectionClick).toHaveBeenCalled();
    }
  });

  it('handles empty pixel data gracefully', () => {
    const { container } = render(
      <AreciboGrid pixelData={[]} onSectionClick={jest.fn()} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders section overlay buttons', () => {
    const { container } = render(
      <AreciboGrid pixelData={mockPixelData} onSectionClick={jest.fn()} />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(7); // 7 sections
  });

  it('has accessible labels', () => {
    render(<AreciboGrid pixelData={mockPixelData} onSectionClick={jest.fn()} />);

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByLabelText(/Click to decode/i)).toBeInTheDocument();
  });
});
