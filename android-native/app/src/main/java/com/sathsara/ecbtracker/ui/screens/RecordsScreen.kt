package com.sathsara.ecbtracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FilterAlt
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sathsara.ecbtracker.ui.theme.*
import com.sathsara.ecbtracker.ui.viewmodel.EntryViewModel
import com.sathsara.ecbtracker.ui.viewmodel.FilterMode

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun RecordsScreen(viewModel: EntryViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val entries by viewModel.entries.collectAsState()
    val sortAsc by viewModel.sortAscending.collectAsState()
    val filterMode by viewModel.filterMode.collectAsState()

    val filterChips = listOf(
        FilterMode.ALL to "All",
        FilterMode.VERIFIED to "Verified",
        FilterMode.PENDING to "Pending",
        FilterMode.THIS_WEEK to "This Week",
        FilterMode.THIS_MONTH to "This Month"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Records", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Row {
                Icon(Icons.Default.Search, contentDescription = "Search", tint = TextSub)
                Spacer(modifier = Modifier.width(16.dp))
                Icon(Icons.Default.FilterAlt, contentDescription = "Filter", tint = TextSub)
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("Daily", "Weekly", "Monthly").forEachIndexed { index, tab ->
                val isActive = index == 0
                Box(
                    modifier = Modifier
                        .background(if (isActive) CyanPrimary else Surface, RoundedCornerShape(6.dp))
                        .border(1.dp, if (isActive) Color.Transparent else BorderColor, RoundedCornerShape(6.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(tab, fontSize = 12.sp, fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal, color = if (isActive) Color(0xFF07090F) else TextSub)
                }
            }
        }
        
        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            filterChips.forEach { (mode, label) ->
                val isActive = filterMode == mode
                Box(
                    modifier = Modifier
                        .background(if (isActive) CyanPrimary else Surface, RoundedCornerShape(6.dp))
                        .border(1.dp, if (isActive) Color.Transparent else BorderColor, RoundedCornerShape(6.dp))
                        .clickable { viewModel.setFilter(mode) }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(label, fontSize = 12.sp, fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal, color = if (isActive) Color(0xFF07090F) else TextSub)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .clickable { viewModel.toggleSort() }
        ) {
            Text(if (sortAsc) "↑ Oldest First" else "↓ Newest First", fontSize = 12.sp, color = TextSub)
        }

        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(entries) { entry ->
                val dismissState = rememberSwipeToDismissBoxState()
                
                LaunchedEffect(dismissState.currentValue) {
                    if (dismissState.currentValue == SwipeToDismissBoxValue.EndToStart) {
                        viewModel.deleteEntry(entry.id)
                    }
                }

                SwipeToDismissBox(
                    state = dismissState,
                    backgroundContent = {
                        val color = if (dismissState.targetValue == SwipeToDismissBoxValue.EndToStart) RedError else Color.Transparent
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(color, RoundedCornerShape(12.dp))
                                .padding(end = 20.dp),
                            contentAlignment = Alignment.CenterEnd
                        ) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.White)
                        }
                    },
                    enableDismissFromStartToEnd = false
                ) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Surface),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Column {
                                    Text(entry.date, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                    Text("${entry.time} · ${entry.appliances.size} appliances", fontSize = 11.sp, color = TextMuted)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    val isVerified = entry.img_url.isNotEmpty()
                                    val badgeBg = if (isVerified) GreenSuccess.copy(alpha = 0.1f) else AmberWarn.copy(alpha = 0.1f)
                                    val badgeBorder = if (isVerified) GreenSuccess.copy(alpha = 0.2f) else AmberWarn.copy(alpha = 0.2f)
                                    val badgeColor = if (isVerified) GreenSuccess else AmberWarn
                                    val badgeText = if (isVerified) "✓ Verified" else "● Pending"
                                    
                                    Box(
                                        modifier = Modifier
                                            .background(badgeBg, RoundedCornerShape(4.dp))
                                            .border(1.dp, badgeBorder, RoundedCornerShape(4.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(badgeText, fontSize = 10.sp, color = badgeColor)
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextSub, modifier = Modifier.size(16.dp))
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            Row(modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Reading", fontSize = 10.sp, color = TextMuted)
                                    Text(String.format("%.1f", entry.unit), fontSize = 16.sp, fontFamily = FontFamily.Monospace, color = TextPrimary)
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Used", fontSize = 10.sp, color = TextMuted)
                                    Text(String.format("%.2f", entry.used), fontSize = 16.sp, fontFamily = FontFamily.Monospace, color = CyanPrimary)
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Cost", fontSize = 10.sp, color = TextMuted)
                                    Text("LKR ${String.format("%.0f", entry.used * 32)}", fontSize = 16.sp, fontFamily = FontFamily.Monospace, color = TextPrimary)
                                }
                            }
                            
                            if (entry.appliances.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(10.dp))
                                FlowRow(
                                    horizontalArrangement = Arrangement.spacedBy(5.dp),
                                    verticalArrangement = Arrangement.spacedBy(5.dp)
                                ) {
                                    val toShow = entry.appliances.take(3)
                                    toShow.forEach { app ->
                                        Box(
                                            modifier = Modifier
                                                .background(PurpleAccent.copy(alpha = 0.08f), RoundedCornerShape(4.dp))
                                                .border(1.dp, PurpleAccent.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                                .padding(horizontal = 7.dp, vertical = 3.dp)
                                        ) {
                                            Text(app, fontSize = 10.sp, color = PurpleAccent)
                                        }
                                    }
                                    if (entry.appliances.size > 3) {
                                        Box(
                                            modifier = Modifier
                                                .background(PurpleAccent.copy(alpha = 0.08f), RoundedCornerShape(4.dp))
                                                .border(1.dp, PurpleAccent.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                                .padding(horizontal = 7.dp, vertical = 3.dp)
                                        ) {
                                            Text("+${entry.appliances.size - 3}", fontSize = 10.sp, color = PurpleAccent)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            item { Spacer(modifier = Modifier.height(80.dp)) }
        }
    }
}
