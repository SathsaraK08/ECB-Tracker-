package com.sathsara.ecbtracker.data.model
import kotlinx.serialization.Serializable

@Serializable
data class UserSettings(
    val id: String = "",
    val user_id: String = "",
    val lkr_per_unit: Double = 32.0,
    val account_number: String = "",
    val owner_name: String = ""
)
