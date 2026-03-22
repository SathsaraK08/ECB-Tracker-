package com.sathsara.ecbtracker.data.repository

import com.sathsara.ecbtracker.data.model.Profile
import com.sathsara.ecbtracker.data.supabase
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.user.UserInfo
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository {
    suspend fun signIn(email: String, password: String): Unit = withContext(Dispatchers.IO) {
        supabase.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
    }

    suspend fun signUp(email: String, password: String, username: String, mobile: String, cebAccount: String): Unit = withContext(Dispatchers.IO) {
        val response = supabase.auth.signUpWith(Email) {
            this.email = email
            this.password = password
        }
        
        val userId = supabase.auth.currentUserOrNull()?.id // usually available after successful signUp
        if (userId != null) {
            val profile = Profile(
                id = userId,
                username = username,
                mobile = mobile,
                ceb_account = cebAccount
            )
            supabase.from("profiles").insert(profile)
        }
    }

    suspend fun signOut(): Unit = withContext(Dispatchers.IO) {
        supabase.auth.signOut()
    }

    fun getCurrentUser(): UserInfo? {
        return supabase.auth.currentUserOrNull()
    }

    suspend fun resetPassword(email: String): Unit = withContext(Dispatchers.IO) {
        supabase.auth.resetPasswordForEmail(email)
    }
}
