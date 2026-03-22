package com.sathsara.ecbtracker.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sathsara.ecbtracker.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthViewModel(
    private val authRepository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun clearError() {
        _error.value = null
    }

    fun signIn(email: String, pass: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                authRepository.signIn(email, pass)
                onSuccess()
            } catch (e: Exception) {
                _error.value = e.message ?: "SignIn failed"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun signUp(email: String, pass: String, user: String, mob: String, ceb: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                authRepository.signUp(email, pass, user, mob, ceb)
                onSuccess()
            } catch (e: Exception) {
                _error.value = e.message ?: "SignUp failed"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun signOut(onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                authRepository.signOut()
                onSuccess()
            } catch (e: Exception) { }
        }
    }

    fun getCurrentUser() = authRepository.getCurrentUser()
}
