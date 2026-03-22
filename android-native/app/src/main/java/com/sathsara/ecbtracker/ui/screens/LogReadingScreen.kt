package com.sathsara.ecbtracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sathsara.ecbtracker.data.model.Entry
import com.sathsara.ecbtracker.ui.theme.*
import com.sathsara.ecbtracker.ui.viewmodel.EntryViewModel
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.UUID

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun LogReadingScreen(viewModel: EntryViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    var meterReading by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    val selectedAppliances = remember { mutableStateListOf<String>() }
    
    val appliancesList = listOf(
        "⚡ Kitchen", "💡 Lighting", "❄️ HVAC",
        "🔌 EV Charge", "👕 Laundry", "🖥️ Office",
        "🌬️ AC Bed 1", "🌬️ AC Bed 2",
        "❄️ Fridge", "🚿 Water Heater",
        "📺 TV", "📡 Router", "🌀 Fan", "🍳 Microwave"
    )

    val previousReading = 1254.30 
    val readingVal = meterReading.toDoubleOrNull() ?: 0.0
    val usedUnits = maxOf(0.0, readingVal - previousReading)

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
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Log Reading", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Text("History", fontSize = 14.sp, color = CyanPrimary, fontWeight = FontWeight.Medium, modifier = Modifier.clickable { })
            }
            
            Column(modifier = Modifier.padding(16.dp)) {
                Text("METER READING", fontSize = 12.sp, color = TextSub)
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Surface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        BasicTextField(
                            value = meterReading,
                            onValueChange = { 
                                if (it.length <= 6 && it.all { char -> char.isDigit() || char == '.' }) {
                                    meterReading = it 
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            decorationBox = { innerTextField ->
                                Row(
                                    horizontalArrangement = Arrangement.Center,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    val padded = meterReading.padEnd(5, ' ')
                                    padded.forEachIndexed { index, char ->
                                        val isActive = index == meterReading.length
                                        Box(
                                            modifier = Modifier
                                                .size(42.dp, 58.dp)
                                                .padding(2.dp)
                                                .background(Surface2, RoundedCornerShape(6.dp))
                                                .border(2.dp, if (isActive) CyanPrimary else BorderColor, RoundedCornerShape(6.dp)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            if (char != ' ') {
                                                Text(char.toString(), fontSize = 26.sp, fontFamily = FontFamily.Monospace, color = if (isActive) CyanPrimary else TextPrimary)
                                            }
                                        }
                                        if (index == 4) {
                                            Text(".", fontSize = 26.sp, fontFamily = FontFamily.Monospace, color = TextMuted, modifier = Modifier.align(Alignment.Bottom))
                                        }
                                    }
                                }
                            }
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Previous: $previousReading · Used: ", fontSize = 11.sp, color = TextMuted)
                            Text(String.format("%.2f kWh", usedUnits), fontSize = 11.sp, fontFamily = FontFamily.Monospace, color = CyanPrimary)
                        }
                    }
                }
            }
            
            Column(modifier = Modifier.padding(16.dp)) {
                Text("PHOTO PROOF", fontSize = 12.sp, color = TextSub)
                Spacer(modifier = Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Surface, RoundedCornerShape(12.dp))
                        .border(1.dp, BorderColor, RoundedCornerShape(12.dp)) 
                        .clickable {  }
                        .padding(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .background(CyanPrimary.copy(alpha = 0.1f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.CameraAlt, contentDescription = null, tint = CyanPrimary)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Tap to capture meter photo", fontSize = 13.sp, color = TextSub)
                        Text("AI will auto-extract reading", fontSize = 11.sp, color = TextMuted)
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedButton(
                        onClick = { },
                        modifier = Modifier.weight(1f).height(44.dp),
                        shape = RoundedCornerShape(8.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary)
                    ) {
                        Text("📷 Camera")
                    }
                    OutlinedButton(
                        onClick = { },
                        modifier = Modifier.weight(1f).height(44.dp),
                        shape = RoundedCornerShape(8.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary)
                    ) {
                        Text("🖼️ Gallery")
                    }
                }
            }
            
            Column(modifier = Modifier.padding(16.dp)) {
                Text("ACTIVE APPLIANCES", fontSize = 12.sp, color = TextSub)
                Spacer(modifier = Modifier.height(8.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    appliancesList.forEach { app ->
                        val isSelected = selectedAppliances.contains(app)
                        Box(
                            modifier = Modifier
                                .background(if (isSelected) CyanPrimary.copy(alpha = 0.08f) else Surface, RoundedCornerShape(10.dp))
                                .border(1.dp, if (isSelected) CyanPrimary else BorderColor, RoundedCornerShape(10.dp))
                                .clickable { 
                                    if (isSelected) selectedAppliances.remove(app) else selectedAppliances.add(app)
                                }
                                .padding(horizontal = 10.dp, vertical = 8.dp)
                        ) {
                            Text(app, fontSize = 10.sp, color = if (isSelected) CyanPrimary else TextSub, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal)
                        }
                    }
                }
            }

            Column(modifier = Modifier.padding(16.dp)) {
                Text("NOTE (OPTIONAL)", fontSize = 12.sp, color = TextSub)
                Spacer(modifier = Modifier.height(8.dp))
                TextField(
                    value = note,
                    onValueChange = { note = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp)
                        .border(1.dp, BorderColor, RoundedCornerShape(12.dp)),
                    colors = TextFieldDefaults.textFieldColors(
                        containerColor = Surface,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    ),
                    placeholder = { Text("Add a note about this reading...", fontSize = 13.sp, color = TextMuted) },
                    shape = RoundedCornerShape(12.dp)
                )
            }
        }
        
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Button(
                onClick = {
                    val entry = Entry(
                        id = UUID.randomUUID().toString(),
                        date = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE),
                        time = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")),
                        unit = readingVal,
                        used = usedUnits,
                        note = note,
                        appliances = selectedAppliances.toList(),
                        created_at = ""
                    )
                    viewModel.addEntry(entry)
                    meterReading = ""
                    note = ""
                    selectedAppliances.clear()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary)
            ) {
                Icon(Icons.Default.Check, contentDescription = null, tint = Color(0xFF07090F), modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Confirm & Log Reading", color = Color(0xFF07090F), fontSize = 15.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
