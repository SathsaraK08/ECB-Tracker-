package com.sathsara.ecbtracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sathsara.ecbtracker.ui.theme.*
import com.sathsara.ecbtracker.ui.viewmodel.DashboardViewModel

@Composable
fun DashboardScreen(viewModel: DashboardViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val entries by viewModel.entries.collectAsState()
    val settings by viewModel.settings.collectAsState()
    
    val todayUnits = viewModel.todayUnits
    val currentRate = settings.lkr_per_unit
    
    val monthUnits = viewModel.monthUnits
    val forecast = viewModel.forecastBill
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(top = 16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Good morning,", fontSize = 14.sp, color = TextMuted)
                Text(settings.owner_name.ifEmpty { "User" }, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            }
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .background(
                        brush = Brush.linearGradient(listOf(CyanPrimary, PurpleAccent)),
                        shape = CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                val initials = settings.owner_name.take(2).uppercase().ifEmpty { "ME" }
                Text(initials, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF07090F))
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = Surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text("MONTHLY USAGE", fontSize = 11.sp, color = TextMuted)
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(String.format("%.1f", monthUnits), fontSize = 34.sp, fontFamily = FontFamily.Monospace, color = TextPrimary, fontWeight = FontWeight.Bold)
                    Text(" kWh", fontSize = 18.sp, color = TextSub, modifier = Modifier.padding(bottom = 6.dp))
                }
                Text("Tracking energy efficiently", fontSize = 12.sp, color = TextMuted)
                
                Spacer(modifier = Modifier.height(12.dp))
                
                Row(
                    modifier = Modifier
                        .background(GreenSuccess.copy(alpha = 0.1f), RoundedCornerShape(6.dp))
                        .border(1.dp, GreenSuccess.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = GreenSuccess, modifier = Modifier.size(11.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(String.format("Est. bill: LKR %,.2f", forecast), fontSize = 12.sp, color = GreenSuccess)
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = Surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("TODAY", fontSize = 10.sp, color = TextMuted)
                    Text(String.format("%.1f kWh", todayUnits), fontSize = 22.sp, fontFamily = FontFamily.Monospace, color = TextPrimary, fontWeight = FontWeight.Bold)
                    Text("Daily usage pattern", fontSize = 11.sp, color = TextSub)
                }
            }
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = Surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("RATE / UNIT", fontSize = 10.sp, color = TextMuted)
                    Text(String.format("LKR %.0f", currentRate), fontSize = 22.sp, fontFamily = FontFamily.Monospace, color = TextPrimary, fontWeight = FontWeight.Bold)
                    Text("Current tariff blocks", fontSize = 11.sp, color = TextMuted)
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Weekly Consumption", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text("Monthly ›", fontSize = 12.sp, color = CyanPrimary, modifier = Modifier.clickable {  })
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .height(110.dp),
            colors = CardDefaults.cardColors(containerColor = Surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
        ) {
            val chartData = viewModel.last7Days.reversed()
            val maxVal = chartData.maxOfOrNull { it.units }?.takeIf { it > 0 } ?: 1.0
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                chartData.forEachIndexed { idx, day ->
                    val isActive = idx == chartData.size - 1
                    val hRatio = (day.units / maxVal).toFloat()
                    val barHeight = 60.dp * hRatio
                    
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Bottom,
                        modifier = Modifier.fillMaxHeight()
                    ) {
                        Box(
                            modifier = Modifier
                                .width(20.dp)
                                .height(maxOf(barHeight, 4.dp))
                                .background(
                                    if (isActive) CyanPrimary else CyanPrimary.copy(alpha = 0.2f), 
                                    RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)
                                )
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            day.date.substring(5).replace("-", "/"),
                            fontSize = 9.sp, 
                            color = if (isActive) CyanPrimary else TextMuted
                        )
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Recent Activity", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text("View all ›", fontSize = 12.sp, color = CyanPrimary, modifier = Modifier.clickable {  })
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
        ) {
            Column {
                val recent = entries.sortedByDescending { it.date + it.time }.take(5)
                if (recent.isEmpty()) {
                    Text("No activity yet", modifier = Modifier.padding(16.dp), color = TextMuted, fontSize = 12.sp)
                } else {
                    recent.forEachIndexed { idx, entry ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .background(PurpleAccent.copy(alpha = 0.2f), RoundedCornerShape(10.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("⚡", fontSize = 16.sp)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Meter Reading", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text("${entry.date} at ${entry.time}", fontSize = 11.sp, color = TextMuted)
                            }
                            Text(String.format("+%.1f", entry.used), fontSize = 13.sp, fontFamily = FontFamily.Monospace, color = CyanPrimary)
                        }
                        if (idx < recent.size - 1) {
                            HorizontalDivider(color = BorderColor)
                        }
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
    }
}
