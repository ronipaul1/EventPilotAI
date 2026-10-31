import type { ExpenseItem, ExpenseCategory, BudgetSummary, TaskItem } from '../types';

export const ALL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Venue',
  'Catering',
  'Decoration',
  'Photography',
  'Entertainment',
  'Transportation',
  'Clothing',
  'Invitations',
  'Miscellaneous',
];

/**
 * Calculates real-time financial stats from budget and expense items
 */
export function calculateBudgetSummary(
  totalBudget: number,
  expenses: ExpenseItem[]
): BudgetSummary {
  const safeTotalBudget = Math.max(0, Number(totalBudget) || 0);

  const actualExpenses = expenses.reduce((sum, item) => {
    return sum + (Number(item.amount) || 0);
  }, 0);

  const remainingBalance = safeTotalBudget - actualExpenses;

  const utilizationPercentage =
    safeTotalBudget > 0 ? Math.round((actualExpenses / safeTotalBudget) * 100) : 0;

  // Initialize category map
  const categoryBreakdown = ALL_EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = { spent: 0, planned: 0, count: 0 };
    return acc;
  }, {} as Record<ExpenseCategory, { spent: number; planned: number; count: number }>);

  expenses.forEach((item) => {
    if (categoryBreakdown[item.category]) {
      categoryBreakdown[item.category].spent += Number(item.amount) || 0;
      categoryBreakdown[item.category].planned += Number(item.plannedAmount) || 0;
      categoryBreakdown[item.category].count += 1;
    }
  });

  return {
    totalBudget: safeTotalBudget,
    actualExpenses,
    remainingBalance,
    utilizationPercentage,
    categoryBreakdown,
  };
}

/**
 * Calculates task progress statistics
 */
export function calculateTaskProgress(tasks: TaskItem[]): {
  total: number;
  completed: number;
  pending: number;
  percentage: number;
} {
  const total = tasks.length;
  if (total === 0) {
    return { total: 0, completed: 0, pending: 0, percentage: 0 };
  }
  const completed = tasks.filter((t) => t.isCompleted).length;
  const pending = total - completed;
  const percentage = Math.round((completed / total) * 100);

  return { total, completed, pending, percentage };
}

/**
 * Validates event creation input
 */
export function validateEventInput(input: {
  name: string;
  category: string;
  eventDate: string;
  totalBudget: number;
  guestCount: number;
  location: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length === 0) {
    errors.name = 'Event name is required';
  } else if (input.name.trim().length > 150) {
    errors.name = 'Event name cannot exceed 150 characters';
  }

  if (!input.category) {
    errors.category = 'Category is required';
  }

  if (!input.eventDate) {
    errors.eventDate = 'Event date is required';
  } else {
    const parsed = new Date(input.eventDate);
    if (isNaN(parsed.getTime())) {
      errors.eventDate = 'Invalid date format';
    }
  }

  if (input.totalBudget == null || isNaN(input.totalBudget) || input.totalBudget < 0) {
    errors.totalBudget = 'Total budget must be a non-negative number';
  }

  if (input.guestCount == null || isNaN(input.guestCount) || input.guestCount < 1) {
    errors.guestCount = 'Guest count must be at least 1';
  }

  if (!input.location || input.location.trim().length === 0) {
    errors.location = 'Location is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Calculates countdown days until event
 */
export function calculateDaysRemaining(eventDateString: string): {
  days: number;
  isPast: boolean;
  label: string;
} {
  if (!eventDateString) return { days: 0, isPast: false, label: 'Date not set' };

  const target = new Date(eventDateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), isPast: true, label: `${Math.abs(diffDays)} days ago` };
  } else if (diffDays === 0) {
    return { days: 0, isPast: false, label: 'Today!' };
  } else if (diffDays === 1) {
    return { days: 1, isPast: false, label: 'Tomorrow' };
  } else {
    return { days: diffDays, isPast: false, label: `${diffDays} days to go` };
  }
}
