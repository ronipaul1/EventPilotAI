import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  EventItem,
  ExpenseItem,
  VendorItem,
  GuestItem,
  TaskItem,
  TimelineItem,
  GeneratedAiPlan,
  ChatMessage,
} from '../types';

/* =========================================================================
   EVENTS SERVICE
   ========================================================================= */

export async function getUserEvents(userId: string): Promise<EventItem[]> {
  const collectionPath = 'events';
  try {
    const q = query(
      collection(db, collectionPath),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const events: EventItem[] = [];
    snapshot.forEach((docSnap) => {
      events.push(docSnap.data() as EventItem);
    });
    return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function getEventById(eventId: string): Promise<EventItem | null> {
  const docPath = `events/${eventId}`;
  try {
    const docSnap = await getDoc(doc(db, 'events', eventId));
    if (!docSnap.exists()) return null;
    return docSnap.data() as EventItem;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function createEvent(event: EventItem): Promise<EventItem> {
  const docPath = `events/${event.id}`;
  try {
    await setDoc(doc(db, 'events', event.id), event);
    return event;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateEvent(eventId: string, updates: Partial<EventItem>): Promise<void> {
  const docPath = `events/${eventId}`;
  try {
    await updateDoc(doc(db, 'events', eventId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  const docPath = `events/${eventId}`;
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/* =========================================================================
   GUESTS SERVICE
   ========================================================================= */

export async function getGuestsByEvent(eventId: string, userId: string): Promise<GuestItem[]> {
  const collectionPath = 'guests';
  try {
    const q = query(
      collection(db, collectionPath),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const guests: GuestItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as GuestItem;
      if (data.eventId === eventId) {
        guests.push(data);
      }
    });
    return guests.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function createGuest(guest: GuestItem): Promise<GuestItem> {
  const docPath = `guests/${guest.id}`;
  try {
    await setDoc(doc(db, 'guests', guest.id), guest);
    return guest;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateGuest(guestId: string, updates: Partial<GuestItem>): Promise<void> {
  const docPath = `guests/${guestId}`;
  try {
    await updateDoc(doc(db, 'guests', guestId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteGuest(guestId: string): Promise<void> {
  const docPath = `guests/${guestId}`;
  try {
    await deleteDoc(doc(db, 'guests', guestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function batchCreateGuests(guests: GuestItem[]): Promise<void> {
  if (guests.length === 0) return;
  try {
    const batch = writeBatch(db);
    guests.forEach((g) => {
      batch.set(doc(db, 'guests', g.id), g);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'guests');
  }
}

/* =========================================================================
   EXPENSES SERVICE
   ========================================================================= */

export async function getExpensesByEvent(eventId: string, userId: string): Promise<ExpenseItem[]> {
  const collectionPath = 'expenses';
  try {
    const q = query(
      collection(db, collectionPath),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const items: ExpenseItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as ExpenseItem;
      if (data.eventId === eventId) {
        items.push(data);
      }
    });
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function getAllUserExpenses(userId: string): Promise<ExpenseItem[]> {
  const collectionPath = 'expenses';
  try {
    const q = query(
      collection(db, collectionPath),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const items: ExpenseItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as ExpenseItem);
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function createExpense(expense: ExpenseItem): Promise<ExpenseItem> {
  const docPath = `expenses/${expense.id}`;
  try {
    await setDoc(doc(db, 'expenses', expense.id), expense);
    return expense;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateExpense(expenseId: string, updates: Partial<ExpenseItem>): Promise<void> {
  const docPath = `expenses/${expenseId}`;
  try {
    await updateDoc(doc(db, 'expenses', expenseId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const docPath = `expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, 'expenses', expenseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/* =========================================================================
   VENDORS SERVICE
   ========================================================================= */

export async function getVendorsByEvent(eventId: string, userId: string): Promise<VendorItem[]> {
  const collectionPath = 'vendors';
  try {
    const q = query(
      collection(db, collectionPath),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const vendors: VendorItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as VendorItem;
      if (data.eventId === eventId) {
        vendors.push(data);
      }
    });
    return vendors;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function getAllUserVendors(userId: string): Promise<VendorItem[]> {
  const collectionPath = 'vendors';
  try {
    const q = query(
      collection(db, collectionPath),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const vendors: VendorItem[] = [];
    snapshot.forEach((docSnap) => {
      vendors.push(docSnap.data() as VendorItem);
    });
    return vendors;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function createVendor(vendor: VendorItem): Promise<VendorItem> {
  const docPath = `vendors/${vendor.id}`;
  try {
    await setDoc(doc(db, 'vendors', vendor.id), vendor);
    return vendor;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateVendor(vendorId: string, updates: Partial<VendorItem>): Promise<void> {
  const docPath = `vendors/${vendorId}`;
  try {
    await updateDoc(doc(db, 'vendors', vendorId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteVendor(vendorId: string): Promise<void> {
  const docPath = `vendors/${vendorId}`;
  try {
    await deleteDoc(doc(db, 'vendors', vendorId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/* =========================================================================
   TASKS SERVICE
   ========================================================================= */

export async function getTasksByEvent(eventId: string, userId: string): Promise<TaskItem[]> {
  const collectionPath = 'tasks';
  try {
    const q = query(
      collection(db, collectionPath),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const tasks: TaskItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as TaskItem;
      if (data.eventId === eventId) {
        tasks.push(data);
      }
    });
    return tasks.sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function getAllUserTasks(userId: string): Promise<TaskItem[]> {
  const collectionPath = 'tasks';
  try {
    const q = query(
      collection(db, collectionPath),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const tasks: TaskItem[] = [];
    snapshot.forEach((docSnap) => {
      tasks.push(docSnap.data() as TaskItem);
    });
    return tasks;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function createTask(task: TaskItem): Promise<TaskItem> {
  const docPath = `tasks/${task.id}`;
  try {
    await setDoc(doc(db, 'tasks', task.id), task);
    return task;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateTask(taskId: string, updates: Partial<TaskItem>): Promise<void> {
  const docPath = `tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const docPath = `tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function batchCreateTasks(tasks: TaskItem[]): Promise<void> {
  if (tasks.length === 0) return;
  try {
    const batch = writeBatch(db);
    tasks.forEach((task) => {
      batch.set(doc(db, 'tasks', task.id), task);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'tasks');
  }
}

/* =========================================================================
   TIMELINE SERVICE
   ========================================================================= */

export async function getTimelinesByEvent(eventId: string, userId: string): Promise<TimelineItem[]> {
  const collectionPath = 'timelines';
  try {
    const q = query(
      collection(db, collectionPath),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const items: TimelineItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as TimelineItem;
      if (data.eventId === eventId) {
        items.push(data);
      }
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function createTimeline(item: TimelineItem): Promise<TimelineItem> {
  const docPath = `timelines/${item.id}`;
  try {
    await setDoc(doc(db, 'timelines', item.id), item);
    return item;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateTimeline(timelineId: string, updates: Partial<TimelineItem>): Promise<void> {
  const docPath = `timelines/${timelineId}`;
  try {
    await updateDoc(doc(db, 'timelines', timelineId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteTimeline(timelineId: string): Promise<void> {
  const docPath = `timelines/${timelineId}`;
  try {
    await deleteDoc(doc(db, 'timelines', timelineId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function batchCreateTimelines(items: TimelineItem[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      batch.set(doc(db, 'timelines', item.id), item);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'timelines');
  }
}

/* =========================================================================
   AI PLAN CACHE SERVICE
   ========================================================================= */

export async function getAiPlanByEvent(eventId: string): Promise<GeneratedAiPlan | null> {
  const docPath = `aiPlans/${eventId}`;
  try {
    const snap = await getDoc(doc(db, 'aiPlans', eventId));
    if (!snap.exists()) return null;
    return snap.data()?.plan as GeneratedAiPlan;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function saveAiPlan(eventId: string, userId: string, plan: GeneratedAiPlan): Promise<void> {
  const docPath = `aiPlans/${eventId}`;
  try {
    await setDoc(doc(db, 'aiPlans', eventId), {
      id: eventId,
      eventId,
      userId,
      plan,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/* =========================================================================
   AI CHAT CONVERSATIONS SERVICE
   ========================================================================= */

export async function getAiConversationsByEvent(eventId: string, userId: string): Promise<ChatMessage[]> {
  const collectionPath = 'aiConversations';
  try {
    const q = query(
      collection(db, collectionPath),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const msgs: ChatMessage[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as ChatMessage;
      if (data.eventId === eventId) {
        msgs.push(data);
      }
    });
    return msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function saveAiChatMessage(msg: ChatMessage): Promise<void> {
  const docPath = `aiConversations/${msg.id}`;
  try {
    await setDoc(doc(db, 'aiConversations', msg.id), msg);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}
