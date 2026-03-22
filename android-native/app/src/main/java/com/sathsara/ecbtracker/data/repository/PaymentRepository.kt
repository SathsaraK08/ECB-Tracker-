package com.sathsara.ecbtracker.data.repository

import com.sathsara.ecbtracker.data.model.Payment
import com.sathsara.ecbtracker.data.supabase
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class PaymentRepository {
    suspend fun getPayments(userId: String): List<Payment> = withContext(Dispatchers.IO) {
        supabase.from("payments")
            .select {
                filter { eq("user_id", userId) }
            }.decodeList<Payment>()
    }

    suspend fun upsertPayment(payment: Payment): Unit = withContext(Dispatchers.IO) {
        supabase.from("payments").upsert(payment)
    }

    suspend fun deletePayment(id: String, userId: String): Unit = withContext(Dispatchers.IO) {
        supabase.from("payments").delete {
            filter {
                eq("id", id)
                eq("user_id", userId)
            }
        }
    }
}
