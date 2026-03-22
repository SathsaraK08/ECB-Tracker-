package com.sathsara.ecbtracker.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sathsara.ecbtracker.data.model.Entry
import com.sathsara.ecbtracker.data.model.UserSettings
import com.sathsara.ecbtracker.data.repository.AuthRepository
import com.sathsara.ecbtracker.data.repository.EntryRepository
import com.sathsara.ecbtracker.data.repository.SettingsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter

data class DayData(val date: String, val units: Double)

class DashboardViewModel(
    private val entryRepository: EntryRepository = EntryRepository(),
    private val settingsRepository: SettingsRepository = SettingsRepository(),
    private val authRepository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val _entries = MutableStateFlow<List<Entry>>(emptyList())
    val entries: StateFlow<List<Entry>> = _entries.asStateFlow()

    private val _settings = MutableStateFlow(UserSettings())
    val settings: StateFlow<UserSettings> = _settings.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    val todayUnits: Double get() {
        val today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
        return entries.value.filter { it.date == today }.sumOf { it.used }
    }

    val weekUnits: Double get() {
        val today = LocalDate.now()
        val startOfWeek = today.minusDays(today.dayOfWeek.value.toLong() - 1)
        return entries.value.filter { 
            val d = LocalDate.parse(it.date)
            !d.isBefore(startOfWeek) && !d.isAfter(today)
        }.sumOf { it.used }
    }

    val monthUnits: Double get() {
        val today = LocalDate.now()
        val startOfMonth = today.withDayOfMonth(1)
        return entries.value.filter {
            val d = LocalDate.parse(it.date)
            !d.isBefore(startOfMonth) && !d.isAfter(today)
        }.sumOf { it.used }
    }

    val monthCost: Double get() = monthUnits * settings.value.lkr_per_unit

    val forecastBill: Double get() {
        val today = LocalDate.now()
        val daysInMonth = YearMonth.from(today).lengthOfMonth()
        val daysLogged = today.dayOfMonth
        if (daysLogged == 0) return 0.0
        return (monthUnits / daysLogged) * daysInMonth * settings.value.lkr_per_unit
    }

    val last7Days: List<DayData> get() {
        val today = LocalDate.now()
        return (6 downTo 0).map { i ->
            val date = today.minusDays(i.toLong())
            val dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
            val units = entries.value.filter { it.date == dateStr }.sumOf { it.used }
            DayData(dateStr, units)
        }
    }

    fun loadData() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val userId = authRepository.getCurrentUser()?.id ?: return@launch
                _settings.value = settingsRepository.getSettings(userId)
                val fetchedEntries = entryRepository.getEntries(userId)
                _entries.value = fetchedEntries
            } catch (e: Exception) {
                // Ignore for now
            } finally {
                _isLoading.value = false
            }
        }
    }
}
