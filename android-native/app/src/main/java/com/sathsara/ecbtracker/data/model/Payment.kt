package com.sathsara.ecbtracker.data.model
import kotlinx.serialization.Serializable

@Serializable
data class Payment(
    val id: String = "",
    val user_id: String = "",
    val month: String = "",
    val last_units: String = "",
    val bill_amount: String = "",
    val paid_amount: String = "",
    val paid: Boolean = false,
    val bank: String = "",
    val payee_name: String = "",
    val payee_account: String = "",
    val note: String = "",
    val created_at: String = ""
)
