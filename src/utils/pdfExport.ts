import jsPDF from 'jspdf';
import type {
  EventItem,
  ExpenseItem,
  VendorItem,
  TaskItem,
  TimelineItem,
  GeneratedAiPlan,
} from '../types';
import { calculateBudgetSummary, calculateTaskProgress } from './budgetCalculations';
import { sortTimelineItems } from './timelineSorting';

export interface ReportData {
  event: EventItem;
  expenses: ExpenseItem[];
  vendors: VendorItem[];
  tasks: TaskItem[];
  timelines: TimelineItem[];
  aiPlan?: GeneratedAiPlan | null;
}

export function generateEventPdfReport(data: ReportData) {
  const { event, expenses, vendors, tasks, timelines, aiPlan } = data;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(245, 158, 11); // amber-500
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('EventPilot AI', 14, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Official Master Event Planning Dossier — ${event.name}`, 14, 28);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 28, { align: 'right' });

  yPos = 48;

  // Section 1: Event Overview
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Event Specifications', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const leftX = 14;
  const colWidth = 85;

  doc.text(`Event Name: ${event.name}`, leftX, yPos);
  doc.text(`Category: ${event.category.toUpperCase()}`, leftX + colWidth, yPos);
  yPos += 6;
  doc.text(`Target Date: ${event.eventDate}`, leftX, yPos);
  doc.text(`Duration: ${event.durationHours || 5} hours`, leftX + colWidth, yPos);
  yPos += 6;
  doc.text(`Location: ${event.location}`, leftX, yPos);
  doc.text(`Guest Count: ${event.guestCount} guests`, leftX + colWidth, yPos);
  yPos += 6;
  doc.text(`Theme / Style: ${event.theme || 'Classic'}`, leftX, yPos);
  doc.text(`Total Budget: ${event.currency} ${event.totalBudget.toLocaleString()}`, leftX + colWidth, yPos);
  yPos += 6;
  if (event.dietaryRequirements && event.dietaryRequirements !== 'None') {
    doc.text(`Dietary Notes: ${event.dietaryRequirements}`, leftX, yPos);
    yPos += 6;
  }
  if (event.accessibilityRequirements && event.accessibilityRequirements !== 'None') {
    doc.text(`Accessibility Notes: ${event.accessibilityRequirements}`, leftX, yPos);
    yPos += 6;
  }

  yPos += 6;

  // Section 2: Budget & Financial Health
  const budgetSummary = calculateBudgetSummary(event.totalBudget, expenses);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Financial Ledger & Budget Analysis', 14, yPos);
  yPos += 8;

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL ALLOCATED', 20, yPos + 6);
  doc.text('ACTUAL EXPENDITURE', 70, yPos + 6);
  doc.text('REMAINING BALANCE', 125, yPos + 6);
  doc.text('UTILIZATION', 165, yPos + 6);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${event.currency} ${budgetSummary.totalBudget.toLocaleString()}`, 20, yPos + 14);
  doc.text(`${event.currency} ${budgetSummary.actualExpenses.toLocaleString()}`, 70, yPos + 14);

  if (budgetSummary.remainingBalance < 0) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(16, 185, 129);
  }
  doc.text(`${event.currency} ${budgetSummary.remainingBalance.toLocaleString()}`, 125, yPos + 14);

  doc.setTextColor(15, 23, 42);
  doc.text(`${budgetSummary.utilizationPercentage}%`, 165, yPos + 14);

  yPos += 28;

  // Expense table rows
  if (expenses.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Recent Line-Item Expenses:', 14, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    expenses.slice(0, 7).forEach((exp) => {
      doc.text(`• [${exp.category}] ${exp.description}`, 16, yPos);
      doc.text(
        `${event.currency} ${exp.amount.toLocaleString()} (${exp.paidStatus.replace('_', ' ')})`,
        pageWidth - 14,
        yPos,
        { align: 'right' }
      );
      yPos += 5;
    });
  }

  yPos += 6;

  // Section 3: Task & Milestone Progress
  const taskProgress = calculateTaskProgress(tasks);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. Execution & Task Checklist', 14, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Checklist Status: ${taskProgress.completed} of ${taskProgress.total} completed (${taskProgress.percentage}%)`,
    14,
    yPos
  );
  yPos += 6;

  tasks.slice(0, 6).forEach((task) => {
    const mark = task.isCompleted ? '[x]' : '[ ]';
    doc.setFontSize(9);
    doc.text(`${mark} [${task.priority.toUpperCase()}] ${task.title}`, 16, yPos);
    if (task.dueDate) {
      doc.text(`Due: ${task.dueDate}`, pageWidth - 14, yPos, { align: 'right' });
    }
    yPos += 5;
  });

  // Check if page needs split
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos += 6;
  }

  // Section 4: Vendors Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('4. Vendor Coordination Ledger', 14, yPos);
  yPos += 7;

  if (vendors.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('No vendor contracts or estimates currently logged.', 16, yPos);
    yPos += 8;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    vendors.slice(0, 6).forEach((vendor) => {
      doc.text(`• ${vendor.name} (${vendor.category}) — Status: ${vendor.bookingStatus}`, 16, yPos);
      doc.text(
        `Agreed: ${event.currency} ${vendor.actualCost || vendor.estimatedCost || 0}`,
        pageWidth - 14,
        yPos,
        { align: 'right' }
      );
      yPos += 5;
    });
    yPos += 4;
  }

  // Section 5: Timeline
  if (timelines.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('5. Timeline & Day-Of Schedule (Chronological Order)', 14, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const sortedPdfTimelines = sortTimelineItems(timelines, 'timing_asc');
    sortedPdfTimelines.slice(0, 10).forEach((item) => {
      const timeInfo = item.startTime ? `${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''} • ` : item.date ? `${item.date} • ` : '';
      doc.text(`• ${timeInfo}${item.title} [${item.status.toUpperCase()}]`, 16, yPos);
      yPos += 5;
    });
    yPos += 4;
  }

  // Section 6: AI Strategic Advice
  if (aiPlan?.personalizedRecommendations?.length) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('6. Strategic AI Planning Recommendations', 14, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    aiPlan.personalizedRecommendations.slice(0, 4).forEach((rec) => {
      const splitText = doc.splitTextToSize(`• ${rec}`, pageWidth - 32);
      doc.text(splitText, 16, yPos);
      yPos += splitText.length * 4.5;
    });
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `EventPilot AI — Confidential Event Master Plan | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${event.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_event_plan.pdf`);
}
