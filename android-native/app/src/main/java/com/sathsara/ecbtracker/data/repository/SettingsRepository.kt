package com.sathsara.ecbtracker.data.repository

import com.sathsara.ecbtracker.data.model.UserSettings
import com.sathsara.ecbtracker.data.supabase
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class SettingsRepository {
    suspend fun getSettings(userId: String): UserSettings = withContext(Dispatchers.IO) {
        val results = supabase.from("user_settings")
            .select {
                filter { eq("user_id", userId) }
            }.decodeList<UserSettings>()
            
        results.firstOrNull() ?: UserSettings(user_id = userId)
    }

    suspend fun saveSettings(settings: UserSettings): Unit = withContext(Dispatchers.IO) {
        supabase.from("user_settings").upsert(settings)
    }
}
