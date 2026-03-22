package com.sathsara.ecbtracker.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sathsara.ecbtracker.data.model.Entry
import com.sathsara.ecbtracker.data.repository.AuthRepository
import com.sathsara.ecbtracker.data.repository.EntryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class FilterMode {
    ALL, VERIFIED, PENDING, THIS_WEEK, THIS_MONTH
}

class EntryViewModel(
    private val repository: EntryRepository = EntryRepository(),
    private val authRepository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val _entries = MutableStateFlow<List<Entry>>(emptyList())
    val entries: StateFlow<List<Entry>> = _entries.asStateFlow()

    private val _sortAscending = MutableStateFlow(false)
    val sortAscending: StateFlow<Boolean> = _sortAscending.asStateFlow()

    private val _filterMode = MutableStateFlow(FilterMode.ALL)
    val filterMode: StateFlow<FilterMode> = _filterMode.asStateFlow()

    fun loadEntries() {
        viewModelScope.launch {
            try {
                val userId = authRepository.getCurrentUser()?.id ?: return@launch
                val loaded = repository.getEntries(userId)
                _entries.value = applySortAndFilter(loaded)
            } catch (e: Exception) { }
        }
    }

    fun addEntry(entry: Entry) {
        viewModelScope.launch {
            try {
                val userId = authRepository.getCurrentUser()?.id ?: return@launch
                repository.addEntry(entry.copy(user_id = userId))
                loadEntries()
            } catch (e: Exception) { }
        }
    }

    fun updateEntry(entry: Entry) {
        viewModelScope.launch {
            try {
                repository.updateEntry(entry)
                loadEntries()
            } catch (e: Exception) { }
        }
    }

    fun deleteEntry(id: String) {
        viewModelScope.launch {
            try {
                val userId = authRepository.getCurrentUser()?.id ?: return@launch
                repository.deleteEntry(id, userId)
                loadEntries()
            } catch (e: Exception) { }
        }
    }

    fun toggleSort() {
        _sortAscending.value = !_sortAscending.value
        loadEntries()
    }

    fun setFilter(mode: FilterMode) {
        _filterMode.value = mode
        loadEntries()
    }

    private fun applySortAndFilter(list: List<Entry>): List<Entry> {
        var result = list
        // Sort specifically
        result = if (_sortAscending.value) {
            result.sortedBy { it.date + it.time }
        } else {
            result.sortedByDescending { it.date + it.time }
        }
        return result
    }
}
