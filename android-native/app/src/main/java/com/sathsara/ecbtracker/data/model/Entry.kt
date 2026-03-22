package com.sathsara.ecbtracker.data.model
import kotlinx.serialization.Serializable

@Serializable
data class Entry(
    val id: String = "",
    val user_id: String = "",
    val date: String = "",
    val time: String = "",
    val unit: Double = 0.0,
    val used: Double = 0.0,
    val note: String = "",
    val appliances: List<String> = emptyList(),
    val img_url: String = "",
    val created_at: String = ""
)
