import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { EventWizard } from './components/EventWizard';

// Independent Modular Pages
import { OverviewPage } from './pages/OverviewPage';
import { MyEventsPage } from './pages/MyEventsPage';
import { GuestsPage } from './pages/GuestsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CopilotPage } from './pages/CopilotPage';

// Views
import { AiPlannerView } from './components/AiPlannerView';
import { BudgetView } from './components/BudgetView';
import { TimelineView } from './components/TimelineView';
import { VendorsView } from './components/VendorsView';
import { ChecklistView } from './components/ChecklistView';

// Services & Types
import {
  getUserEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getGuestsByEvent,
  createGuest,
  updateGuest,
  deleteGuest,
  batchCreateGuests,
  getExpensesByEvent,
  getAllUserExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getVendorsByEvent,
  getAllUserVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getTasksByEvent,
  getAllUserTasks,
  createTask,
  updateTask,
  deleteTask,
  batchCreateTasks,
  getTimelinesByEvent,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  batchCreateTimelines,
  getAiPlanByEvent,
  saveAiPlan,
  getAiConversationsByEvent,
  saveAiChatMessage,
} from './services/firestoreService';
import { calculateBudgetSummary } from './utils/budgetCalculations';
import type {
  EventItem,
  ExpenseItem,
  VendorItem,
  GuestItem,
  TaskItem,
  TimelineItem,
  GeneratedAiPlan,
  ChatMessage,
  ExpenseCategory,
} from './types';
import { CheckCircle2, AlertCircle, Menu, X } from 'lucide-react';

function EventPilotApp() {
  const { user } = useAuth();

  // Navigation & UI state
  const [currentPage, setCurrentPage] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto-open scanner or guests view if launched standalone
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openScanner') === 'true' || window.location.hash === '#scanner') {
        setCurrentPage('guests');
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Core Data State
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Active Event sub-resources
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [timelines, setTimelines] = useState<TimelineItem[]>([]);
  const [aiPlan, setAiPlan] = useState<GeneratedAiPlan | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Cross-Event Aggregates for Overview
  const [allUserExpenses, setAllUserExpenses] = useState<ExpenseItem[]>([]);
  const [allUserVendors, setAllUserVendors] = useState<VendorItem[]>([]);
  const [allUserTasks, setAllUserTasks] = useState<TaskItem[]>([]);

  // Async States
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch user events on login or mount
  useEffect(() => {
    if (!user) {
      // In guest or new session: empty array for zero fake data display!
      setEvents([]);
      setSelectedEvent(null);
      setExpenses([]);
      setVendors([]);
      setGuests([]);
      setTasks([]);
      setTimelines([]);
      setAiPlan(null);
      setChatMessages([]);
      setAllUserExpenses([]);
      setAllUserVendors([]);
      setAllUserTasks([]);
      return;
    }

    const loadUserEvents = async () => {
      setIsDataLoading(true);
      try {
        const userEvents = await getUserEvents(user.uid);
        if (userEvents && userEvents.length > 0) {
          setEvents(userEvents);
          // Preserve currently selected event if still present, else pick first
          setSelectedEvent((prev) => {
            if (prev && userEvents.some((e) => e.id === prev.id)) {
              return userEvents.find((e) => e.id === prev.id)!;
            }
            return userEvents[0];
          });
        } else {
          setEvents([]);
          setSelectedEvent(null);
        }

        // Also fetch all user expenses, vendors, and tasks for portfolio analytics
        const [allExp, allVen, allTsk] = await Promise.all([
          getAllUserExpenses(user.uid).catch(() => []),
          getAllUserVendors(user.uid).catch(() => []),
          getAllUserTasks(user.uid).catch(() => []),
        ]);
        setAllUserExpenses(allExp || []);
        setAllUserVendors(allVen || []);
        setAllUserTasks(allTsk || []);
      } catch (err) {
        console.warn('Error loading user events:', err);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadUserEvents();
  }, [user]);

  // 2. Fetch active event sub-collections whenever selectedEvent changes
  useEffect(() => {
    if (!selectedEvent || !user) {
      setExpenses([]);
      setVendors([]);
      setGuests([]);
      setTasks([]);
      setTimelines([]);
      setAiPlan(null);
      setChatMessages([]);
      return;
    }

    const loadSubCollections = async () => {
      setIsDataLoading(true);
      try {
        const [
          loadedExpenses,
          loadedVendors,
          loadedGuests,
          loadedTasks,
          loadedTimelines,
          loadedPlan,
          loadedChat,
        ] = await Promise.all([
          getExpensesByEvent(selectedEvent.id, user.uid).catch(() => []),
          getVendorsByEvent(selectedEvent.id, user.uid).catch(() => []),
          getGuestsByEvent(selectedEvent.id, user.uid).catch(() => []),
          getTasksByEvent(selectedEvent.id, user.uid).catch(() => []),
          getTimelinesByEvent(selectedEvent.id, user.uid).catch(() => []),
          getAiPlanByEvent(selectedEvent.id).catch(() => null),
          getAiConversationsByEvent(selectedEvent.id, user.uid).catch(() => []),
        ]);

        setExpenses(loadedExpenses || []);
        setVendors(loadedVendors || []);
        setGuests(loadedGuests || []);
        setTasks(loadedTasks || []);
        setTimelines(loadedTimelines || []);
        setAiPlan(loadedPlan || null);
        setChatMessages(loadedChat || []);
      } catch (err) {
        console.warn('Error loading subcollections for event:', err);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadSubCollections();
  }, [selectedEvent?.id, user]);

  // =========================================================================
  // EVENT CRUD HANDLERS
  // =========================================================================

  const handleCreateEvent = async (newEvent: EventItem, autoGenerateAi: boolean) => {
    try {
      if (user) {
        await createEvent(newEvent);
      }
      setEvents((prev) => [newEvent, ...prev]);
      setSelectedEvent(newEvent);
      showToast(`Celebration "${newEvent.name}" registered successfully!`);

      if (autoGenerateAi) {
        await handleGenerateAiPlan(newEvent);
      }
      setCurrentPage('overview');
    } catch (err) {
      console.error('Error creating event:', err);
      showToast('Failed to save event. Please verify connection.', 'error');
      throw err;
    }
  };

  const handleUpdateEvent = async (id: string, updates: Partial<EventItem>) => {
    try {
      if (user) {
        await updateEvent(id, updates);
      }
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      if (selectedEvent?.id === id) {
        setSelectedEvent((prev) => (prev ? { ...prev, ...updates } : null));
      }
      showToast('Event specifications updated!');
    } catch (err) {
      console.error('Error updating event:', err);
      showToast('Could not update event details.', 'error');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      if (user) {
        await deleteEvent(id);
      }
      const remaining = events.filter((e) => e.id !== id);
      setEvents(remaining);
      if (selectedEvent?.id === id) {
        setSelectedEvent(remaining.length > 0 ? remaining[0] : null);
      }
      showToast('Event removed from your portfolio.');
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast('Failed to delete event.', 'error');
    }
  };

  // =========================================================================
  // GUEST CRUD HANDLERS
  // =========================================================================

  const handleAddGuest = async (newGuest: GuestItem) => {
    try {
      if (user) {
        await createGuest(newGuest);
      }
      setGuests((prev) => [newGuest, ...prev]);
      showToast(`Guest "${newGuest.name}" added to list!`);
    } catch (err) {
      console.error('Error adding guest:', err);
      showToast('Failed to record guest.', 'error');
    }
  };

  const handleUpdateGuest = async (id: string, updates: Partial<GuestItem>) => {
    try {
      if (user) {
        await updateGuest(id, updates);
      }
      setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
      showToast('Guest record updated!');
    } catch (err) {
      console.error('Error updating guest:', err);
      showToast('Failed to update guest.', 'error');
    }
  };

  const handleDeleteGuest = async (id: string) => {
    try {
      if (user) {
        await deleteGuest(id);
      }
      setGuests((prev) => prev.filter((g) => g.id !== id));
      showToast('Guest removed from invitation list.');
    } catch (err) {
      console.error('Error deleting guest:', err);
      showToast('Failed to delete guest.', 'error');
    }
  };

  const handleBatchImportGuests = async (importedGuests: GuestItem[]) => {
    try {
      if (user) {
        await batchCreateGuests(importedGuests);
      }
      setGuests((prev) => [...importedGuests, ...prev]);
      showToast(`Imported ${importedGuests.length} guests with unique QR passes!`);
    } catch (err) {
      console.error('Error importing guests batch:', err);
      showToast('Could not save all imported guests.', 'error');
    }
  };

  const handleCheckInGuest = async (guestId: string) => {
    const checkInTime = new Date().toISOString();
    try {
      if (user) {
        await updateGuest(guestId, { checkInStatus: 'checked_in', checkInTime });
      }
      setGuests((prev) =>
        prev.map((g) => (g.id === guestId ? { ...g, checkInStatus: 'checked_in', checkInTime } : g))
      );
      showToast('Guest checked in successfully!');
    } catch (err) {
      console.error('Error checking in guest:', err);
      showToast('Could not record check-in status.', 'error');
    }
  };

  // =========================================================================
  // EXPENSE CRUD HANDLERS
  // =========================================================================

  const handleAddExpense = async (exp: ExpenseItem) => {
    try {
      if (user) {
        await createExpense(exp);
      }
      setExpenses((prev) => [exp, ...prev]);
      setAllUserExpenses((prev) => [exp, ...prev]);
      showToast('Expense recorded successfully!');
    } catch (err) {
      console.error('Error adding expense:', err);
      showToast('Failed to save expense.', 'error');
    }
  };

  const handleUpdateExpense = async (id: string, updates: Partial<ExpenseItem>) => {
    try {
      if (user) {
        await updateExpense(id, updates);
      }
      setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      setAllUserExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      showToast('Expense updated!');
    } catch (err) {
      console.error('Error updating expense:', err);
      showToast('Failed to update expense.', 'error');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      if (user) {
        await deleteExpense(id);
      }
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setAllUserExpenses((prev) => prev.filter((e) => e.id !== id));
      showToast('Expense removed from ledger');
    } catch (err) {
      console.error('Error deleting expense:', err);
      showToast('Failed to delete expense.', 'error');
    }
  };

  // =========================================================================
  // VENDOR CRUD HANDLERS
  // =========================================================================

  const handleAddVendor = async (vendor: VendorItem) => {
    try {
      if (user) {
        await createVendor(vendor);
      }
      setVendors((prev) => [vendor, ...prev]);
      setAllUserVendors((prev) => [vendor, ...prev]);
      showToast(`Vendor "${vendor.name}" registered!`);
    } catch (err) {
      console.error('Error adding vendor:', err);
      showToast('Failed to register vendor.', 'error');
    }
  };

  const handleUpdateVendor = async (id: string, updates: Partial<VendorItem>) => {
    try {
      if (user) {
        await updateVendor(id, updates);
      }
      setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
      setAllUserVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
      showToast('Vendor updated!');
    } catch (err) {
      console.error('Error updating vendor:', err);
      showToast('Failed to update vendor.', 'error');
    }
  };

  const handleDeleteVendor = async (id: string) => {
    try {
      if (user) {
        await deleteVendor(id);
      }
      setVendors((prev) => prev.filter((v) => v.id !== id));
      setAllUserVendors((prev) => prev.filter((v) => v.id !== id));
      showToast('Vendor removed');
    } catch (err) {
      console.error('Error deleting vendor:', err);
      showToast('Failed to delete vendor.', 'error');
    }
  };

  // =========================================================================
  // TASK CRUD HANDLERS
  // =========================================================================

  const handleAddTask = async (task: TaskItem) => {
    try {
      if (user) {
        await createTask(task);
      }
      setTasks((prev) => [task, ...prev]);
      setAllUserTasks((prev) => [task, ...prev]);
      showToast('Task added to checklist!');
    } catch (err) {
      console.error('Error adding task:', err);
      showToast('Failed to save task.', 'error');
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<TaskItem>) => {
    try {
      if (user) {
        await updateTask(id, updates);
      }
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      setAllUserTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    } catch (err) {
      console.error('Error updating task:', err);
      showToast('Failed to update task.', 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      if (user) {
        await deleteTask(id);
      }
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setAllUserTasks((prev) => prev.filter((t) => t.id !== id));
      showToast('Task removed');
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast('Failed to delete task.', 'error');
    }
  };

  // =========================================================================
  // TIMELINE CRUD HANDLERS
  // =========================================================================

  const handleAddTimeline = async (item: TimelineItem) => {
    try {
      if (user) {
        await createTimeline(item);
      }
      setTimelines((prev) => [item, ...prev]);
      showToast('Schedule slot created!');
    } catch (err) {
      console.error('Error adding timeline:', err);
      showToast('Failed to save schedule slot.', 'error');
    }
  };

  const handleUpdateTimeline = async (id: string, updates: Partial<TimelineItem>) => {
    try {
      if (user) {
        await updateTimeline(id, updates);
      }
      setTimelines((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      showToast('Timeline updated');
    } catch (err) {
      console.error('Error updating timeline:', err);
      showToast('Failed to update timeline.', 'error');
    }
  };

  const handleDeleteTimeline = async (id: string) => {
    try {
      if (user) {
        await deleteTimeline(id);
      }
      setTimelines((prev) => prev.filter((t) => t.id !== id));
      showToast('Timeline slot removed');
    } catch (err) {
      console.error('Error deleting timeline:', err);
      showToast('Failed to delete timeline entry.', 'error');
    }
  };

  // =========================================================================
  // GEMINI AI INTEGRATION
  // =========================================================================

  const handleGenerateAiPlan = async (targetEvent?: EventItem) => {
    const evt = targetEvent || selectedEvent;
    if (!evt) return;

    setIsAiGenerating(true);
    setCurrentPage('planner');

    try {
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: evt }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      if (data.plan) {
        setAiPlan(data.plan);
        if (user) {
          await saveAiPlan(evt.id, user.uid, data.plan).catch(console.warn);
        }
        showToast('Gemini master event blueprint generated successfully!');
      }
    } catch (err) {
      console.error('Error generating AI plan:', err);
      showToast('Could not complete Gemini planning. Please try again.', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleRegenerateSection = async (section: string, customInstructions: string) => {
    if (!selectedEvent || !aiPlan) return;
    try {
      const res = await fetch('/api/ai/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: selectedEvent,
          section,
          userInstructions: customInstructions,
        }),
      });

      if (!res.ok) throw new Error('Failed to regenerate section');

      const data = await res.json();
      const updatedPlan = { ...aiPlan, [section]: data.data };
      setAiPlan(updatedPlan);

      if (user) {
        await saveAiPlan(selectedEvent.id, user.uid, updatedPlan).catch(console.warn);
      }
      showToast(`Section "${section}" regenerated!`);
    } catch (err) {
      console.error('Regeneration error:', err);
      showToast('Could not regenerate section.', 'error');
    }
  };

  const handleSaveEditedPlan = async (updated: GeneratedAiPlan) => {
    setAiPlan(updated);
    if (user && selectedEvent) {
      await saveAiPlan(selectedEvent.id, user.uid, updated).catch(console.warn);
    }
    showToast('Event Master Blueprint edits saved!');
  };

  const handleSyncBudgetToExpenses = async (
    budgetItems: GeneratedAiPlan['budgetDistribution']
  ) => {
    if (!selectedEvent) return;

    const newExpenses: ExpenseItem[] = budgetItems.map((item, i) => ({
      id: `exp_sync_${Date.now()}_${i}`,
      eventId: selectedEvent.id,
      userId: user?.uid || 'guest_user',
      category: (item.category as ExpenseCategory) || 'Miscellaneous',
      description: `[AI Allocation] ${item.description.slice(0, 80)}`,
      amount: item.suggestedAmount,
      plannedAmount: item.suggestedAmount,
      date: new Date().toISOString().split('T')[0],
      paidStatus: 'unpaid',
      notes: `Suggested by Gemini AI (~${item.percentage}% allocation)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (user) {
      try {
        for (const exp of newExpenses) {
          await createExpense(exp);
        }
      } catch (err) {
        console.warn('Batch syncing expenses:', err);
      }
    }

    setExpenses((prev) => [...newExpenses, ...prev]);
    setAllUserExpenses((prev) => [...newExpenses, ...prev]);
    showToast(`Synced ${newExpenses.length} budget items to Expenses Ledger!`);
  };

  const handleImportTasks = async (aiTasks: GeneratedAiPlan['taskChecklist']) => {
    if (!selectedEvent) return;

    const newTasks: TaskItem[] = aiTasks.map((t, idx) => ({
      id: `task_ai_${Date.now()}_${idx}`,
      eventId: selectedEvent.id,
      userId: user?.uid || 'guest_user',
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      isCompleted: false,
      source: 'ai',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (user) {
      await batchCreateTasks(newTasks).catch(console.warn);
    }

    setTasks((prev) => [...prev, ...newTasks]);
    setAllUserTasks((prev) => [...prev, ...newTasks]);
    showToast(`Imported ${newTasks.length} tasks into your Smart Checklist!`);
  };

  const handleImportTimeline = async (
    milestones: GeneratedAiPlan['preparationMilestones'],
    dayOf: GeneratedAiPlan['dayOfSchedule']
  ) => {
    if (!selectedEvent) return;

    const timelineItems: TimelineItem[] = [];

    milestones.forEach((m, idx) => {
      timelineItems.push({
        id: `tl_m_${Date.now()}_${idx}`,
        eventId: selectedEvent.id,
        userId: user?.uid || 'guest_user',
        type: 'milestone',
        title: m.title,
        description: m.description,
        priority: m.priority,
        status: 'pending',
        date: selectedEvent.eventDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    dayOf.forEach((d, idx) => {
      timelineItems.push({
        id: `tl_d_${Date.now()}_${idx}`,
        eventId: selectedEvent.id,
        userId: user?.uid || 'guest_user',
        type: 'day_of',
        title: d.title,
        description: d.description,
        startTime: d.time,
        priority: 'high',
        status: 'pending',
        date: selectedEvent.eventDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    if (user) {
      await batchCreateTimelines(timelineItems).catch(console.warn);
    }

    setTimelines((prev) => [...prev, ...timelineItems]);
    showToast(`Imported ${timelineItems.length} milestone & schedule items!`);
  };

  const handleImportVendors = async (aiVendors: GeneratedAiPlan['vendorRequirements']) => {
    if (!selectedEvent) return;

    const vendorItems: VendorItem[] = aiVendors.map((v, idx) => ({
      id: `ven_ai_${Date.now()}_${idx}`,
      eventId: selectedEvent.id,
      userId: user?.uid || 'guest_user',
      name: v.name,
      category: v.category,
      estimatedCost: v.estimatedCost,
      actualCost: v.estimatedCost,
      bookingStatus: 'Not Contacted',
      notes: `AI Guidance: ${v.tips}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (user) {
      for (const item of vendorItems) {
        await createVendor(item).catch(console.warn);
      }
    }

    setVendors((prev) => [...prev, ...vendorItems]);
    setAllUserVendors((prev) => [...prev, ...vendorItems]);
    showToast(`Imported ${vendorItems.length} vendors into coordination CRM!`);
  };

  // Conversational AI Copilot Handler
  const handleSendChatMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `chat_${Date.now()}_u`,
      eventId: selectedEvent?.id,
      userId: user?.uid || 'guest_user',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    if (user) {
      await saveAiChatMessage(userMsg).catch(console.warn);
    }

    try {
      const budgetStats = selectedEvent
        ? calculateBudgetSummary(selectedEvent.totalBudget, expenses)
        : undefined;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          event: selectedEvent || undefined,
          history: chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          contextData: {
            actualExpenses: budgetStats?.actualExpenses,
            remainingBudget: budgetStats?.remainingBalance,
            completedTasksCount: tasks.filter((t) => t.isCompleted).length,
            totalTasksCount: tasks.length,
            vendorCount: vendors.length,
            guestCount: guests.length,
          },
        }),
      });

      if (!res.ok) throw new Error('AI Copilot request failed');

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `chat_${Date.now()}_a`,
        eventId: selectedEvent?.id,
        userId: user?.uid || 'guest_user',
        role: 'assistant',
        content: data.reply || 'Here is my planning recommendation.',
        createdAt: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
      if (user) {
        await saveAiChatMessage(assistantMsg).catch(console.warn);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `chat_${Date.now()}_err`,
        eventId: selectedEvent?.id,
        userId: user?.uid || 'guest_user',
        role: 'assistant',
        content:
          'I am ready to help. If experiencing a network spike, here is a quick rule of thumb: Allocate ~45-50% for Venue and Catering, 15% for Decor, 12% for Photography & Video, and maintain a 10% contingency reserve.',
        createdAt: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const activeScheduleItems = useMemo(
    () => (selectedEvent ? timelines.filter((t) => t.eventId === selectedEvent.id) : timelines),
    [timelines, selectedEvent]
  );
  const scheduleCompletedCount = useMemo(
    () => activeScheduleItems.filter((t) => t.status === 'completed').length,
    [activeScheduleItems]
  );
  const taskCompletedCount = useMemo(
    () => tasks.filter((t) => t.isCompleted).length,
    [tasks]
  );
  const totalCompletedCount = scheduleCompletedCount + taskCompletedCount;
  const totalChecklistCount = activeScheduleItems.length + tasks.length;
  const pendingChecklistCount = totalChecklistCount - totalCompletedCount;

  const pendingTaskCount = pendingChecklistCount;
  const completedTaskCount = totalCompletedCount;
  const totalTaskCount = totalChecklistCount;
  const budgetSummary = useMemo(
    () => (selectedEvent ? calculateBudgetSummary(selectedEvent.totalBudget, expenses) : undefined),
    [selectedEvent, expenses]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
              toastMessage.type === 'error'
                ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200'
                : toastMessage.type === 'info'
                ? 'bg-sky-50/95 dark:bg-sky-950/90 border-sky-300 dark:border-sky-500/40 text-sky-800 dark:text-sky-200'
                : 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar */}
      <div className="hidden lg:flex flex-shrink-0 h-full">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
          }}
          selectedEvent={selectedEvent}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          pendingTaskCount={pendingTaskCount}
          completedTaskCount={completedTaskCount}
          totalTaskCount={totalTaskCount}
          guestCount={guests.length}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-slate-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar
              currentPage={currentPage}
              onNavigate={(page) => {
                setCurrentPage(page);
                setMobileMenuOpen(false);
              }}
              selectedEvent={selectedEvent}
              collapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              pendingTaskCount={pendingTaskCount}
              completedTaskCount={completedTaskCount}
              totalTaskCount={totalTaskCount}
              guestCount={guests.length}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Right Column: TopNav + Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <div className="flex items-center">
          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-3 text-slate-600 dark:text-slate-300 hover:text-slate-900"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <TopNav
              events={events}
              selectedEvent={selectedEvent}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onOpenCreateWizard={() => setIsWizardOpen(true)}
              onNavigate={(page) => setCurrentPage(page)}
              onSearch={(q) => setSearchQuery(q)}
              searchQuery={searchQuery}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'overview' && (
              <OverviewPage
                events={events}
                selectedEvent={selectedEvent}
                allExpenses={allUserExpenses}
                allVendors={allUserVendors}
                allTasks={allUserTasks}
                activeTasks={tasks}
                allTimelines={timelines}
                allGuests={guests}
                onSelectEvent={(evt) => setSelectedEvent(evt)}
                onNavigate={(page) => setCurrentPage(page)}
                onOpenCreateWizard={() => setIsWizardOpen(true)}
                onDeleteEvent={handleDeleteEvent}
                onUpdateTask={handleUpdateTask}
                onAddTask={handleAddTask}
                onUpdateTimeline={handleUpdateTimeline}
              />
            )}

            {currentPage === 'events' && (
              <MyEventsPage
                events={events}
                selectedEvent={selectedEvent}
                onSelectEvent={(evt) => setSelectedEvent(evt)}
                onOpenCreateWizard={() => setIsWizardOpen(true)}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
                onNavigate={(page) => setCurrentPage(page)}
              />
            )}

            {currentPage === 'planner' && (
              <AiPlannerView
                event={selectedEvent}
                plan={aiPlan}
                isLoading={isAiGenerating}
                onGeneratePlan={() => handleGenerateAiPlan()}
                onRegenerateSection={handleRegenerateSection}
                onSaveEditedPlan={handleSaveEditedPlan}
                onSyncBudgetToExpenses={handleSyncBudgetToExpenses}
                onImportTasks={handleImportTasks}
                onImportTimeline={handleImportTimeline}
                onImportVendors={handleImportVendors}
                onNavigateToEvents={() => setCurrentPage('events')}
              />
            )}

            {currentPage === 'budget' && (
              <BudgetView
                event={selectedEvent}
                expenses={expenses}
                onAddExpense={handleAddExpense}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
                onNavigate={(page) => setCurrentPage(page)}
              />
            )}

            {currentPage === 'timeline' && (
              <TimelineView
                event={selectedEvent}
                timelines={timelines}
                onAddTimeline={handleAddTimeline}
                onUpdateTimeline={handleUpdateTimeline}
                onDeleteTimeline={handleDeleteTimeline}
                onNavigateToEvents={() => setCurrentPage('events')}
              />
            )}

            {currentPage === 'guests' && (
              <GuestsPage
                event={selectedEvent}
                guests={guests}
                onAddGuest={handleAddGuest}
                onBatchImportGuests={handleBatchImportGuests}
                onUpdateGuest={handleUpdateGuest}
                onDeleteGuest={handleDeleteGuest}
                onCheckInGuest={handleCheckInGuest}
                onNavigate={(page) => setCurrentPage(page)}
              />
            )}

            {currentPage === 'vendors' && (
              <VendorsView
                event={selectedEvent}
                vendors={vendors}
                onAddVendor={handleAddVendor}
                onUpdateVendor={handleUpdateVendor}
                onDeleteVendor={handleDeleteVendor}
                onNavigate={(page) => setCurrentPage(page)}
              />
            )}

            {currentPage === 'checklist' && (
              <ChecklistView
                event={selectedEvent}
                tasks={tasks}
                timelines={timelines}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onUpdateTimeline={handleUpdateTimeline}
                onNavigateToEvents={() => setCurrentPage('events')}
              />
            )}

            {currentPage === 'copilot' && (
              <CopilotPage
                event={selectedEvent}
                messages={chatMessages}
                onSendMessage={handleSendChatMessage}
                isLoading={isChatLoading}
                budgetSummary={budgetSummary}
                completedTasksCount={tasks.filter((t) => t.isCompleted).length}
                totalTasksCount={tasks.length}
                vendorCount={vendors.length}
                guestCount={guests.length}
                onNavigate={(page) => setCurrentPage(page)}
              />
            )}

            {currentPage === 'reports' && (
              <ReportsPage
                event={selectedEvent}
                expenses={expenses}
                vendors={vendors}
                tasks={tasks}
                timelines={timelines}
                guests={guests}
                aiPlan={aiPlan}
                onNavigate={(page) => setCurrentPage(page)}
              />
            )}

            {currentPage === 'settings' && (
              <SettingsPage
                onClearCache={() => {
                  setAiPlan(null);
                  showToast('Local application cache refreshed');
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Event Creation Wizard */}
      <EventWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmit={handleCreateEvent}
        userId={user?.uid || 'guest_user'}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EventPilotApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
