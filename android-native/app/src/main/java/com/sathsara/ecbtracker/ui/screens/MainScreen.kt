package com.sathsara.ecbtracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.InsertChart
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.sathsara.ecbtracker.ui.theme.*

@Composable
fun MainScreen(startTab: Int = 0, onSignOut: () -> Unit) {
    var selectedTab by remember { mutableIntStateOf(startTab) }

    Scaffold(
        bottomBar = {
            BottomNavBar(selectedTab = selectedTab, onTabSelected = { selectedTab = it })
        },
        containerColor = Background
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding).fillMaxSize()) {
            when (selectedTab) {
                0 -> DashboardScreen()
                1 -> LogReadingScreen()
                2 -> RecordsScreen()
                3 -> PaymentsScreen()
                4 -> ReportsScreen()
                5 -> SettingsScreen(onSignOut = onSignOut)
            }
        }
    }
}

@Composable
fun BottomNavBar(selectedTab: Int, onTabSelected: (Int) -> Unit) {
    val items = listOf(
        Icons.Default.Home to "Home",
        Icons.Default.AddCircle to "Log",
        Icons.Default.Description to "Records",
        Icons.Default.AttachMoney to "Payments",
        Icons.Default.InsertChart to "Reports",
        Icons.Default.Person to "Profile"
    )

    Surface(
        color = Surface,
        modifier = Modifier.fillMaxWidth(),
        shadowElevation = 8.dp
    ) {
        Column(modifier = Modifier.background(Surface)) {
            HorizontalDivider(thickness = 1.dp, color = BorderColor)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp)
                    .windowInsetsPadding(WindowInsets.navigationBars),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                items.forEachIndexed { index, pair ->
                    val isActive = selectedTab == index
                    val color = if (isActive) CyanPrimary else TextMuted

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .clickable { onTabSelected(index) }
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                            .defaultMinSize(minWidth = 48.dp, minHeight = 48.dp),
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = pair.first,
                            contentDescription = pair.second,
                            tint = color,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(
                            modifier = Modifier
                                .size(width = 32.dp, height = 3.dp)
                                .clip(RoundedCornerShape(1.5.dp))
                                .background(if (isActive) CyanPrimary else Color.Transparent)
                        )
                    }
                }
            }
        }
    }
}

// Dummy placeholders until we build them
@Composable fun DashboardScreen() { Box(Modifier.fillMaxSize()) }
@Composable fun LogReadingScreen() { Box(Modifier.fillMaxSize()) }
@Composable fun RecordsScreen() { Box(Modifier.fillMaxSize()) }
@Composable fun PaymentsScreen() { Box(Modifier.fillMaxSize()) }
@Composable fun ReportsScreen() { Box(Modifier.fillMaxSize()) }
@Composable fun SettingsScreen(onSignOut: () -> Unit) { Box(Modifier.fillMaxSize()) }
