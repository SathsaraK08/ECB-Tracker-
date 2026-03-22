package com.sathsara.ecbtracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.sathsara.ecbtracker.ui.navigation.AppNavigation
import com.sathsara.ecbtracker.ui.theme.ECBTrackerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ECBTrackerTheme {
                AppNavigation()
            }
        }
    }
}
