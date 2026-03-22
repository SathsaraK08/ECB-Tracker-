package com.sathsara.ecbtracker.data.repository

import com.sathsara.ecbtracker.data.model.Entry
import com.sathsara.ecbtracker.data.supabase
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.storage.storage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class EntryRepository {
    suspend fun getEntries(userId: String): List<Entry> = withContext(Dispatchers.IO) {
        supabase.from("entries")
            .select(Columns.ALL) {
                filter {
                    eq("user_id", userId)
                }
                order("date", Order.ASCENDING)
                order("time", Order.ASCENDING)
            }.decodeList<Entry>()
    }

    suspend fun addEntry(entry: Entry): Entry = withContext(Dispatchers.IO) {
        supabase.from("entries")
            .insert(entry) { select() }
            .decodeSingle<Entry>()
    }

    suspend fun updateEntry(entry: Entry): Unit = withContext(Dispatchers.IO) {
        supabase.from("entries")
            .update(entry) {
                filter {
                    eq("id", entry.id)
                    eq("user_id", entry.user_id)
                }
            }
    }

    suspend fun deleteEntry(id: String, userId: String): Unit = withContext(Dispatchers.IO) {
        supabase.from("entries")
            .delete {
                filter {
                    eq("id", id)
                    eq("user_id", userId)
                }
            }
    }

    suspend fun uploadImage(userId: String, date: String, bytes: ByteArray): String = withContext(Dispatchers.IO) {
        val path = "$userId/$date-${System.currentTimeMillis()}.jpg"
        val bucket = supabase.storage.from("meter-images")
        bucket.upload(path, bytes)
        bucket.publicUrl(path)
    }
}
