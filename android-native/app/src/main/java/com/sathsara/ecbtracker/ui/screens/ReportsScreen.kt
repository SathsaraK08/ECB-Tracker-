package com.sathsara.ecbtracker.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.TableChart
import androidx.compose.material.icons.filled.TableView
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sathsara.ecbtracker.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ReportsScreen() {
    var monthlyAuto by remember { mutableStateOf(true) }
    var weeklyAuto by remember { mutableStateOf(false) }
    
    var showToast by remember { mutableStateOf(false) }
    var toastMessage by remember { mutableStateOf("") }
    val coroutineScope = rememberCoroutineScope()

    fun showDownloadToast(filename: String) {
        toastMessage = "Downloading $filename..."
        showToast = true
        coroutineScope.launch {
            delay(3000)
            showToast = false
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Background)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 80.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Reports & Export", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            }

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .background(Surface2, RoundedCornerShape(6.dp))
                            .border(1.dp, BorderColor, RoundedCornerShape(6.dp))
                            .padding(horizontal = 12.dp, vertical = 10.dp)
                    ) {
                        Text("From", fontSize = 10.sp, color = TextMuted)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text("2023-10-01", fontSize = 14.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = TextPrimary)
                    }
                    
                    Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = TextMuted, modifier = Modifier.padding(horizontal = 12.dp))
                    
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .background(Surface2, RoundedCornerShape(6.dp))
                            .border(1.dp, BorderColor, RoundedCornerShape(6.dp))
                            .padding(horizontal = 12.dp, vertical = 10.dp)
                    ) {
                        Text("To", fontSize = 10.sp, color = TextMuted)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text("2023-10-31", fontSize = 14.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = TextPrimary)
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text("Export Format", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary, modifier = Modifier.padding(horizontal = 16.dp))
            Spacer(modifier = Modifier.height(12.dp))
            
            ExportCard(
                title = "Excel Spreadsheet",
                desc = "Full data · readings, costs, appliances",
                iconColor = GreenSuccess,
                icon = Icons.Default.TableView,
                onClick = { showDownloadToast("ecb_report_oct.xlsx") }
            )
            
            ExportCard(
                title = "CSV File",
                desc = "Raw data · import to any spreadsheet",
                iconColor = CyanPrimary,
                icon = Icons.Default.TableChart,
                onClick = { showDownloadToast("ecb_raw_data.csv") }
            )
            
            ExportCard(
                title = "PDF Report",
                desc = "Formatted · ready to print or share",
                iconColor = RedError,
                icon = Icons.Default.PictureAsPdf,
                onClick = { showDownloadToast("ecb_summary.pdf") }
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text("Auto Reports", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary, modifier = Modifier.padding(horizontal = 16.dp))
            Spacer(modifier = Modifier.height(12.dp))
            
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Monthly email report", fontSize = 14.sp, color = TextPrimary)
                            Text("Sent on 1st of each month", fontSize = 11.sp, color = TextMuted)
                        }
                        Switch(
                            checked = monthlyAuto,
                            onCheckedChange = { monthlyAuto = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = CyanPrimary,
                                uncheckedThumbColor = Color.White,
                                uncheckedTrackColor = BorderColor
                            )
                        )
                    }
                    HorizontalDivider(color = BorderColor)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Weekly summary", fontSize = 14.sp, color = TextPrimary)
                            Text("Every Monday morning", fontSize = 11.sp, color = TextMuted)
                        }
                        Switch(
                            checked = weeklyAuto,
                            onCheckedChange = { weeklyAuto = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = CyanPrimary,
                                uncheckedThumbColor = Color.White,
                                uncheckedTrackColor = BorderColor
                            )
                        )
                    }
                }
            }
        }
        
        AnimatedVisibility(
            visible = showToast,
            enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { it }) + fadeOut(),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 80.dp, start = 16.dp, end = 16.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(GreenSuccess, RoundedCornerShape(8.dp))
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(toastMessage, color = Color(0xFF07090F), fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
        }
    }
}

@Composable
fun ExportCard(
    title: String,
    desc: String,
    iconColor: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(iconColor.copy(alpha = 0.1f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconColor)
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Text(desc, fontSize = 12.sp, color = TextMuted)
            }
            Icon(Icons.Default.Download, contentDescription = "Download", tint = iconColor)
        }
    }
}
