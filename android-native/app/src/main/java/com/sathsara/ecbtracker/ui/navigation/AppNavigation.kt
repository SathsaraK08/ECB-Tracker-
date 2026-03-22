package com.sathsara.ecbtracker.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.sathsara.ecbtracker.ui.screens.AuthScreen
import com.sathsara.ecbtracker.ui.screens.MainScreen
import com.sathsara.ecbtracker.ui.viewmodel.AuthViewModel

@Composable
fun AppNavigation(authViewModel: AuthViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val navController = rememberNavController()
    val currentUser = authViewModel.getCurrentUser()
    val startDest = if (currentUser != null) "main/0" else "auth"

    NavHost(navController = navController, startDestination = startDest) {
        composable("auth") {
            AuthScreen(
                viewModel = authViewModel,
                onAuthSuccess = {
                    navController.navigate("main/0") {
                        popUpTo("auth") { inclusive = true }
                    }
                }
            )
        }
        composable("main/{startTab}") { backStackEntry ->
            val startTab = backStackEntry.arguments?.getString("startTab")?.toIntOrNull() ?: 0
            MainScreen(
                startTab = startTab,
                onSignOut = {
                    navController.navigate("auth") {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
