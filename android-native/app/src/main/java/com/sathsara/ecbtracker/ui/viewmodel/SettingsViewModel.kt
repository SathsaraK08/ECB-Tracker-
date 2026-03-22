package com.sathsara.ecbtracker.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sathsara.ecbtracker.data.model.UserSettings
import com.sathsara.ecbtracker.data.repository.AuthRepository
import com.sathsara.ecbtracker.data.repository.SettingsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val settingsRepository: SettingsRepository = SettingsRepository(),
    private val authRepository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val _settings = MutableStateFlow(UserSettings())
    val settings: StateFlow<UserSettings> = _settings.asStateFlow()

    fun loadSettings() {
        viewModelScope.launch {
            try {
                val userId = authRepository.getCurrentUser()?.id ?: return@launch
                _settings.value = settingsRepository.getSettings(userId)
            } catch (e: Exception) { }
        }
    }

    fun updateSettings(newSettings: UserSettings) {
        viewModelScope.launch {
            try {
                settingsRepository.saveSettings(newSettings)
                _settings.value = newSettings
            } catch (e: Exception) { }
        }
    }
}
