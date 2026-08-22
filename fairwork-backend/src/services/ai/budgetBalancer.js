/**
 * Production Integer Cents Budget Balancer for FairWork AI
 *
 * Performs calculations in integer base units (cents = amount * 100) to eliminate
 * floating-point rounding errors (0.1 + 0.2 !== 0.3) in Web3/monetary milestones.
 */

function balanceMilestones(milestones = [], targetBudget = 0) {
  const budgetUsd = Number(targetBudget)
  if (isNaN(budgetUsd) || budgetUsd <= 0 || !Array.isArray(milestones) || milestones.length === 0) {
    return milestones
  }

  // Convert budget to integer cents to avoid floating point drift
  const targetBudgetCents = Math.round(budgetUsd * 100)

  // 1. Sanitize raw milestone objects and convert to integer cents
  const cleaned = milestones.map((m, idx) => ({
    title: m.title ? String(m.title).trim() : `Milestone ${idx + 1}`,
    cents: Math.max(100, Math.round((Number(m.amount) || 0) * 100)),
    dueDate: m.dueDate || null,
  }))

  const totalCentsSum = cleaned.reduce((sum, m) => sum + m.cents, 0)
  if (totalCentsSum <= 0) {
    return cleaned.map((m) => ({ title: m.title, amount: Math.round(m.cents / 100), dueDate: m.dueDate }))
  }

  // 2. Proportionally scale cents to targetBudgetCents using integer math
  let currentCentsSum = 0
  const scaled = cleaned.map((m, idx) => {
    if (idx === cleaned.length - 1) return m // Last milestone will take remainder delta
    const scaledCents = Math.max(100, Math.round((m.cents / totalCentsSum) * targetBudgetCents))
    currentCentsSum += scaledCents
    return { title: m.title, cents: scaledCents, dueDate: m.dueDate }
  })

  // 3. Adjust the final milestone's cents so SUM === targetBudgetCents exactly
  const remainderCents = targetBudgetCents - currentCentsSum
  const finalCents = Math.max(100, remainderCents)
  scaled[scaled.length - 1] = {
    title: cleaned[cleaned.length - 1].title,
    cents: finalCents,
    dueDate: cleaned[cleaned.length - 1].dueDate,
  }

  // 4. Convert integer cents back to base USD amounts
  return scaled.map((m) => ({
    title: m.title,
    amount: m.cents / 100,
    dueDate: m.dueDate,
  }))
}

module.exports = {
  balanceMilestones,
}
