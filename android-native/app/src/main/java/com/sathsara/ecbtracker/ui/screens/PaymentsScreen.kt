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
import androidx.compose.material.icons.filled.Info
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
import com.sathsara.ecbtracker.ui.viewmodel.PaymentsViewModel

@Composable
fun PaymentsScreen(viewModel: PaymentsViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val payments by viewModel.payments.collectAsState()
    
    var showAddForm by remember { mutableStateOf(false) }

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
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Payments", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Icon(Icons.Default.Info, contentDescription = "Info", tint = TextSub)
        }

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = Surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("October 2023", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Due: 28 Oct · 482.5 kWh used", fontSize = 11.sp, color = TextMuted)
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text("LKR 4,280.50", fontSize = 32.sp, fontFamily = FontFamily.Monospace, color = TextPrimary)
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("LAST UNITS", fontSize = 10.sp, color = TextMuted)
                        Text("1254.30", fontSize = 14.sp, fontFamily = FontFamily.Monospace, color = TextPrimary)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text("ACCOUNT NO", fontSize = 10.sp, color = TextMuted)
                        Text("1029384756", fontSize = 14.sp, color = TextPrimary)
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(
                        onClick = { showAddForm = !showAddForm },
                        modifier = Modifier.weight(1f).height(44.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary)
                    ) {
                        Text("Pay Now", color = Color(0xFF07090F), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                    OutlinedButton(
                        onClick = {  },
                        modifier = Modifier.height(44.dp),
                        shape = RoundedCornerShape(8.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                        contentPadding = PaddingValues(horizontal = 14.dp)
                    ) {
                        Text("Invoice", fontSize = 12.sp)
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        if (showAddForm) {
            AddEditPaymentForm(onClose = { showAddForm = false })
        } else {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Payment History", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Text("Export ›", fontSize = 12.sp, color = CyanPrimary, modifier = Modifier.clickable {  })
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column {
                    val dummyHistory = listOf(
                        Triple("September 2023", "LKR 4,120.00", "Paid"),
                        Triple("August 2023", "LKR 3,950.00", "Paid")
                    )
                    
                    dummyHistory.forEachIndexed { idx, item ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(modifier = Modifier.size(8.dp).background(GreenSuccess, CircleShape))
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(item.first, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text("Paid 25 Sep · Bank transfer", fontSize = 11.sp, color = TextMuted)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(item.second, fontSize = 14.sp, fontFamily = FontFamily.Monospace, color = TextPrimary)
                                Text("● ${item.third}", fontSize = 10.sp, color = GreenSuccess)
                            }
                        }
                        if (idx < dummyHistory.size - 1) {
                            HorizontalDivider(color = BorderColor)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AddEditPaymentForm(onClose: () -> Unit) {
    var isPaid by remember { mutableStateOf(false) }
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Record Payment", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Spacer(modifier = Modifier.height(16.dp))
            
            CustomTextField(label = "Month", placeholder = "e.g. October 2023", value = "") { }
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(modifier = Modifier.weight(1f)) {
                    CustomTextField(label = "Units Consumed", placeholder = "0.0", value = "") { }
                }
                Box(modifier = Modifier.weight(1f)) {
                    CustomTextField(label = "Bill Amount", placeholder = "0.0", value = "") { }
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            CustomTextField(label = "Amount Paid", placeholder = "0.0", value = "") { }
            
            Spacer(modifier = Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = isPaid, onCheckedChange = { isPaid = it })
                Text("Payment completed", fontSize = 12.sp, color = TextPrimary, modifier = Modifier.clickable { isPaid = !isPaid })
            }
            
            if (isPaid) {
                Spacer(modifier = Modifier.height(12.dp))
                CustomTextField(label = "Bank", placeholder = "e.g. Commercial Bank", value = "") { }
                Spacer(modifier = Modifier.height(12.dp))
                CustomTextField(label = "Payee Name", placeholder = "CEB", value = "") { }
                Spacer(modifier = Modifier.height(12.dp))
                CustomTextField(label = "Account No.", placeholder = "1234567890", value = "") { }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            CustomTextField(label = "Notes (Optional)", placeholder = "Add a note...", value = "") { }
            
            Spacer(modifier = Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(
                    onClick = onClose,
                    modifier = Modifier.weight(1f).height(50.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
                ) {
                    Text("Cancel")
                }
                Button(
                    onClick = onClose,
                    modifier = Modifier.weight(1f).height(50.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary)
                ) {
                    Text("Save", color = Color(0xFF07090F), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
