package com.sathsara.ecbtracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sathsara.ecbtracker.ui.theme.*
import com.sathsara.ecbtracker.ui.viewmodel.AuthViewModel
import com.sathsara.ecbtracker.ui.viewmodel.SettingsViewModel

@Composable
fun SettingsScreen(
    settingsViewModel: SettingsViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    authViewModel: AuthViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onSignOut: () -> Unit
) {
    val settings by settingsViewModel.settings.collectAsState()
    val currentUser = authViewModel.getCurrentUser()
    val email = currentUser?.email ?: "user@example.com"
    
    var darkMode by remember { mutableStateOf(true) }
    var billReminders by remember { mutableStateOf(true) }
    var usageAlerts by remember { mutableStateOf(true) }
    var weeklyDigest by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(bottom = 80.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Surface)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .background(Brush.linearGradient(listOf(CyanPrimary, PurpleAccent)), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                val initials = settings.owner_name.take(2).uppercase().ifEmpty { "ME" }
                Text(initials, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF07090F))
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(settings.owner_name.ifEmpty { "User Name" }, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Text("$email · CEB: ${settings.account_number.ifEmpty { "N/A" }}", fontSize = 12.sp, color = TextMuted)
            }
        }
        HorizontalDivider(color = BorderColor)
        
        Spacer(modifier = Modifier.height(24.dp))
        
        SettingsSection(title = "APPEARANCE") {
            SettingsToggleItem(
                name = "Dark Mode",
                sub = "Switch between light & dark theme",
                checked = darkMode,
                onCheckedChange = { darkMode = it },
                isLast = true
            )
        }
        
        SettingsSection(title = "BILLING") {
            SettingsActionItem(
                name = "Rate per Unit",
                value = "LKR ${String.format("%.2f", settings.lkr_per_unit)} / kWh",
                actionText = "Edit",
                onClick = { }
            )
            SettingsActionItem(
                name = "CEB Account No.",
                value = settings.account_number.ifEmpty { "Not Set" },
                actionText = "Edit",
                onClick = { },
                isLast = true
            )
        }
        
        SettingsSection(title = "NOTIFICATIONS") {
            SettingsToggleItem(
                name = "Bill reminders",
                sub = "3 days before due date",
                checked = billReminders,
                onCheckedChange = { billReminders = it }
            )
            SettingsToggleItem(
                name = "Usage alerts",
                sub = "When daily usage exceeds avg",
                checked = usageAlerts,
                onCheckedChange = { usageAlerts = it }
            )
            SettingsToggleItem(
                name = "Weekly digest",
                sub = "Every Sunday at 9 AM",
                checked = weeklyDigest,
                onCheckedChange = { weeklyDigest = it },
                isLast = true
            )
        }
        
        SettingsSection(title = "ACCOUNT") {
            SettingsChevronItem(
                name = "Change password",
                onClick = { }
            )
            SettingsChevronItem(
                name = "Export all data",
                onClick = { }
            )
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .clickable { authViewModel.signOut(onSignOut) }
                    .padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Sign out", fontSize = 14.sp, color = RedError)
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun SettingsSection(title: String, content: @Composable () -> Unit) {
    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Text(
            title, 
            fontSize = 11.sp, 
            color = TextMuted, 
            letterSpacing = 0.8.sp,
            modifier = Modifier.padding(bottom = 8.dp, start = 4.dp)
        )
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = Surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
        ) {
            Column {
                content()
            }
        }
    }
}

@Composable
fun SettingsToggleItem(name: String, sub: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit, isLast: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 52.dp)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(name, fontSize = 14.sp, color = TextPrimary)
            Text(sub, fontSize = 12.sp, color = TextMuted)
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = CyanPrimary,
                uncheckedThumbColor = Color.White,
                uncheckedTrackColor = BorderColor
            )
        )
    }
    if (!isLast) {
        HorizontalDivider(color = BorderColor, modifier = Modifier.padding(start = 16.dp))
    }
}

@Composable
fun SettingsActionItem(name: String, value: String, actionText: String, onClick: () -> Unit, isLast: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(name, fontSize = 14.sp, color = TextPrimary)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(value, fontSize = 14.sp, color = TextMuted)
            Spacer(modifier = Modifier.width(12.dp))
            Text(actionText, fontSize = 14.sp, color = CyanPrimary, modifier = Modifier.clickable { onClick() })
        }
    }
    if (!isLast) {
        HorizontalDivider(color = BorderColor, modifier = Modifier.padding(start = 16.dp))
    }
}

@Composable
fun SettingsChevronItem(name: String, onClick: () -> Unit, isLast: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clickable { onClick() }
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(name, fontSize = 14.sp, color = TextPrimary)
        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = TextMuted)
    }
    if (!isLast) {
        HorizontalDivider(color = BorderColor, modifier = Modifier.padding(start = 16.dp))
    }
}
