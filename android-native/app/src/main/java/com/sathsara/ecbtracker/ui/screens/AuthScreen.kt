package com.sathsara.ecbtracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sathsara.ecbtracker.ui.theme.*
import com.sathsara.ecbtracker.ui.viewmodel.AuthViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(
    viewModel: AuthViewModel,
    onAuthSuccess: () -> Unit
) {
    var isLogin by remember { mutableStateOf(true) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var mobile by remember { mutableStateOf("") }
    var cebAccount by remember { mutableStateOf("") }
    
    var passwordVisible by remember { mutableStateOf(false) }

    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(horizontal = 32.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(CyanPrimary, RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Bolt, contentDescription = "Logo", tint = Color(0xFF07090F))
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text("ECB Tracker", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Text("Energy Management", fontSize = 11.sp, color = TextMuted)
            }
        }
        
        Spacer(modifier = Modifier.height(40.dp))
        
        Text("Welcome ${if (isLogin) "back" else ""}", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        Text("Track your energy, reduce your bills", fontSize = 14.sp, color = TextMuted)
        
        Spacer(modifier = Modifier.height(32.dp))
        
        if (error != null) {
            Text(text = error ?: "", color = RedError, fontSize = 12.sp, modifier = Modifier.padding(bottom = 16.dp))
        }

        if (!isLogin) {
            CustomTextField("Username", "john_doe", username) { username = it }
            Spacer(modifier = Modifier.height(16.dp))
            CustomTextField("Mobile Number", "+94 77 123 4567", mobile, KeyboardType.Phone) { mobile = it }
            Spacer(modifier = Modifier.height(16.dp))
            CustomTextField("CEB Account Number", "1234567890", cebAccount, KeyboardType.Number) { cebAccount = it }
            Spacer(modifier = Modifier.height(16.dp))
        }

        CustomTextField("Email address", "you@example.com", email, KeyboardType.Email) { email = it; viewModel.clearError() }
        Spacer(modifier = Modifier.height(16.dp))
        
        CustomPasswordField(
            label = "Password",
            placeholder = "••••••••",
            value = password,
            isVisible = passwordVisible,
            onVisibilityChange = { passwordVisible = it },
            onValueChange = { password = it; viewModel.clearError() }
        )
        
        if (!isLogin) {
            Spacer(modifier = Modifier.height(16.dp))
            CustomPasswordField(
                label = "Confirm Password",
                placeholder = "••••••••",
                value = confirmPassword,
                isVisible = passwordVisible,
                onVisibilityChange = { passwordVisible = it },
                onValueChange = { confirmPassword = it }
            )
        }

        if (isLogin) {
            Text(
                "Forgot password?", 
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp, bottom = 18.dp)
                    .clickable {  },
                textAlign = TextAlign.End,
                color = CyanPrimary,
                fontSize = 12.sp
            )
        } else {
            Spacer(modifier = Modifier.height(18.dp))
        }

        Button(
            onClick = {
                if (isLogin) {
                    viewModel.signIn(email, password, onAuthSuccess)
                } else {
                    if (password == confirmPassword) {
                        viewModel.signUp(email, password, username, mobile, cebAccount, onAuthSuccess)
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary),
            enabled = !isLoading
        ) {
            Text(if (isLogin) "Sign In" else "Create Account", color = Color(0xFF07090F), fontSize = 15.sp, fontWeight = FontWeight.Bold)
        }
        
        Spacer(modifier = Modifier.height(10.dp))
        
        OutlinedButton(
            onClick = { 
                isLogin = !isLogin
                viewModel.clearError() 
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = CyanPrimary)
        ) {
            Text(if (isLogin) "Create Account" else "Already have account? Sign In", fontSize = 15.sp, fontWeight = FontWeight.Bold)
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Text(
            "By continuing you agree to our Terms & Privacy Policy", 
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center, 
            color = TextMuted, 
            fontSize = 12.sp
        )
        
        Spacer(modifier = Modifier.height(32.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomTextField(
    label: String,
    placeholder: String,
    value: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    onValueChange: (String) -> Unit
) {
    Column {
        Text(label, fontSize = 12.sp, color = TextSub, modifier = Modifier.padding(bottom = 4.dp))
        TextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
                .border(1.dp, BorderColor, RoundedCornerShape(8.dp)),
            colors = TextFieldDefaults.textFieldColors(
                containerColor = Surface2,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent
            ),
            placeholder = { Text(placeholder, color = TextMuted, fontSize = 14.sp) },
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            shape = RoundedCornerShape(8.dp),
            singleLine = true
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomPasswordField(
    label: String,
    placeholder: String,
    value: String,
    isVisible: Boolean,
    onVisibilityChange: (Boolean) -> Unit,
    onValueChange: (String) -> Unit
) {
    Column {
        Text(label, fontSize = 12.sp, color = TextSub, modifier = Modifier.padding(bottom = 4.dp))
        TextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
                .border(1.dp, BorderColor, RoundedCornerShape(8.dp)),
            colors = TextFieldDefaults.textFieldColors(
                containerColor = Surface2,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent
            ),
            placeholder = { Text(placeholder, color = TextMuted, fontSize = 14.sp) },
            visualTransformation = if (isVisible) VisualTransformation.None else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            trailingIcon = {
                val image = if (isVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff
                IconButton(onClick = { onVisibilityChange(!isVisible) }) {
                    Icon(image, "Toggle", tint = TextMuted)
                }
            },
            shape = RoundedCornerShape(8.dp),
            singleLine = true
        )
    }
}
