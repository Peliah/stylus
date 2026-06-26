"use server"

import { revalidatePath } from "next/cache"
import {
  approveActionsOnly,
  approveAndSendSuggestion,
  approveWithCustomReply,
  rejectSuggestion,
} from "@/lib/suggestion-actions"

export async function approveSendAction(suggestionId: string) {
  await approveAndSendSuggestion(suggestionId)
  revalidatePath("/dashboard/suggestions")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/orders")
}

export async function approveActionsOnlyAction(suggestionId: string) {
  await approveActionsOnly(suggestionId)
  revalidatePath("/dashboard/suggestions")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/orders")
}

export async function rejectSuggestionAction(suggestionId: string) {
  await rejectSuggestion(suggestionId)
  revalidatePath("/dashboard/suggestions")
  revalidatePath("/dashboard")
}

export async function approveWithEditAction(suggestionId: string, formData: FormData) {
  const reply = String(formData.get("reply") ?? "")
  await approveWithCustomReply(suggestionId, reply)
  revalidatePath("/dashboard/suggestions")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/orders")
}
