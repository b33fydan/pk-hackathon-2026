import { render, screen, fireEvent } from '@testing-library/react';
import AreciboRecap from '../AreciboRecap';

// Mock zustand store
jest.mock('../../../store/weeklyStore', () => ({
  useWeeklyStore: () => ({
    selectedSectionIndex: null,
    setSelectedSection: jest.fn(),
    toggleSectionExpanded: jest.fn(),
  }),
}));

describe('AreciboRecap', () => {
  const mockWeekData = {
    weekNumber: 1,
    weekStart: new Date('2024-01-01'),
    weekEnd: new Date('2024-01-07'),
    billsPaid: 3,
    billsTotal: 4,
    habitsCompleted: 12,
    habitsTotal: 14,
    meetings: 4,
    daysActive: 6,
    activeHabits: [
      { name: 'Meditation', completed: 5, total: 7 },
      { name: 'Exercise', completed: 4, total: 5 },
    ],
    longestStreak: { habit: 'Meditation', days: 12 },
    weekSentiment: 'mixed',
  };

  const mockIntent = {
    weekNumber: 1,
    sections: {
      count: { derivative: 'standard', stats: {} },
      elements: { derivative: 'full' },
      pattern: { derivative: 'heatmap', narrative: 'strong_finish' },
      thread: { derivative: 'clean_helix' },
      reflection: { derivative: 'working' },
      kingdom: { derivative: 'overview' },
      signal: { derivative: 'fact_grounded', message: 'Week one complete.' },
    },
  };

  const mockPixelData = Array(23)
    .fill(null)
    .map(() => Array(73).fill(0));

  it('renders when open', () => {
    render(
      <AreciboRecap
        weekData={mockWeekData}
        intent={mockIntent}
        pixelData={mockPixelData}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/Weekly Recap/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <AreciboRecap
        weekData={mockWeekData}
        intent={mockIntent}
        pixelData={mockPixelData}
        open={false}
        onClose={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays week number and date range', () => {
    render(
      <AreciboRecap
        weekData={mockWeekData}
        intent={mockIntent}
        pixelData={mockPixelData}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/Week 1/i)).toBeInTheDocument();
  });

  it('displays all section titles', () => {
    render(
      <AreciboRecap
        weekData={mockWeekData}
        intent={mockIntent}
        pixelData={mockPixelData}
        open={true}
        onClose={jest.fn()}
      />
    );

    const sections = ['Count', 'Elements', 'Pattern', 'Thread', 'Reflection', 'Kingdom', 'Signal'];
    sections.forEach((section) => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(
      <AreciboRecap
        weekData={mockWeekData}
        intent={mockIntent}
        pixelData={mockPixelData}
        open={true}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('displays archive button', () => {
    render(
      <AreciboRecap
        weekData={mockWeekData}
        intent={mockIntent}
        pixelData={mockPixelData}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/View Archive/i)).toBeInTheDocument();
  });

  it('displays save and close button', () => {
    render(
      <AreciboRecap
        weekData={mockWeekData}
        intent={mockIntent}
        pixelData={mockPixelData}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/Save & Close/i)).toBeInTheDocument();
  });

  it('displays share card', () => {
    render(
      <AreciboRecap
        weekData={mockWeekData}
        intent={mockIntent}
        pixelData={mockPixelData}
        open={true}
        onClose={jest.fn()}
        kingdomName="TestKingdom"
        companionName="TestCompanion"
      />
    );

    expect(screen.getByText('TestKingdom')).toBeInTheDocument();
    expect(screen.getByText(/TestCompanion/i)).toBeInTheDocument();
  });

  it('renders grid canvas', () => {
    const { container } = render(
      <AreciboRecap
        weekData={mockWeekData}
        intent={mockIntent}
        pixelData={mockPixelData}
        open={true}
        onClose={jest.fn()}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});
