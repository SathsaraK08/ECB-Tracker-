package com.sathsara.ecbtracker.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sathsara.ecbtracker.data.model.Payment
import com.sathsara.ecbtracker.data.repository.AuthRepository
import com.sathsara.ecbtracker.data.repository.PaymentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PaymentsViewModel(
    private val paymentRepository: PaymentRepository = PaymentRepository(),
    private val authRepository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val _payments = MutableStateFlow<List<Payment>>(emptyList())
    val payments: StateFlow<List<Payment>> = _payments.asStateFlow()

    fun loadPayments() {
        viewModelScope.launch {
            try {
                val userId = authRepository.getCurrentUser()?.id ?: return@launch
                _payments.value = paymentRepository.getPayments(userId)
            } catch (e: Exception) { }
        }
    }

    fun savePayment(payment: Payment) {
        viewModelScope.launch {
            try {
                val userId = authRepository.getCurrentUser()?.id ?: return@launch
                paymentRepository.upsertPayment(payment.copy(user_id = userId))
                loadPayments()
            } catch (e: Exception) { }
        }
    }
}
