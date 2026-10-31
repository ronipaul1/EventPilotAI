export type EventCategory = 'wedding' | 'birthday' | 'community' | 'other';

export type EventStatus = 'planning' | 'confirmed' | 'completed' | 'archived';

export interface EventItem {
  id: string;
  userId: string;
  name: string;
  category: EventCategory;
  eventDate: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  durationHours: number;
  theme: string;
  dietaryRequirements: string;
  accessibilityRequirements: string;
  additionalNotes: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export type GuestGroup = 'family' | 'friend' | 'colleague' | 'vip' | 'general';
export type RsvpStatus = 'attending' | 'declined' | 'pending' | 'tentative';

export interface GuestItem {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  group: GuestGroup;
  rsvpStatus: RsvpStatus;
  plusOnes: number;
  dietaryRequirements?: string;
  tableNumber?: string;
  ticketCode?: string;
  checkInStatus?: 'not_checked_in' | 'checked_in';
  checkInTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'Venue'
  | 'Catering'
  | 'Decoration'
  | 'Photography'
  | 'Entertainment'
  | 'Transportation'
  | 'Clothing'
  | 'Invitations'
  | 'Miscellaneous';

export type PaidStatus = 'unpaid' | 'deposit_paid' | 'paid';

export interface ExpenseItem {
  id: string;
  eventId: string;
  userId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  plannedAmount?: number;
  date: string;
  paidStatus: PaidStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type VendorBookingStatus =
  | 'Not Contacted'
  | 'Contacted'
  | 'Negotiating'
  | 'Confirmed'
  | 'Cancelled';

export interface VendorItem {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  category: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  estimatedCost: number;
  actualCost: number;
  bookingStatus: VendorBookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  eventId: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  priority: TaskPriority;
  dueDate?: string;
  isCompleted: boolean;
  source: 'ai' | 'custom';
  createdAt: string;
  updatedAt: string;
}

export type TimelineType = 'milestone' | 'day_of';
export type TimelineStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

export interface TimelineItem {
  id: string;
  eventId: string;
  userId: string;
  type: TimelineType;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  priority: 'low' | 'medium' | 'high';
  status: TimelineStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedAiPlan {
  overview: string;
  budgetDistribution: Array<{
    category: string;
    suggestedAmount: number;
    percentage: number;
    description: string;
  }>;
  preparationMilestones: Array<{
    title: string;
    description: string;
    targetDateOffsetDays: number;
    priority: 'low' | 'medium' | 'high';
  }>;
  taskChecklist: Array<{
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    suggestedDaysBeforeEvent: number;
  }>;
  vendorRequirements: Array<{
    name: string;
    category: string;
    estimatedCost: number;
    priority: string;
    tips: string;
  }>;
  dayOfSchedule: Array<{
    time: string;
    title: string;
    description: string;
  }>;
  decorationIdeas: string[];
  cateringSuggestions: string[];
  guestManagement: string[];
  personalizedRecommendations: string[];
}

export interface ChatMessage {
  id: string;
  eventId?: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface BudgetSummary {
  totalBudget: number;
  actualExpenses: number;
  remainingBalance: number;
  utilizationPercentage: number;
  categoryBreakdown: Record<ExpenseCategory, { spent: number; planned: number; count: number }>;
}

export interface OverallAppStats {
  totalEvents: number;
  upcomingEvents: number;
  totalBudgetAcrossEvents: number;
  totalExpensesAcrossEvents: number;
  totalPendingTasks: number;
  totalCompletedTasks: number;
  totalVendors: number;
  confirmedVendors: number;
  totalGuests: number;
  attendingGuests: number;
}
