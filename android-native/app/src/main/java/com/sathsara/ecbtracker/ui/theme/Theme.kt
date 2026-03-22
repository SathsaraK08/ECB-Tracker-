package com.sathsara.ecbtracker.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = CyanPrimary,
    onPrimary = Color(0xFF07090F),
    primaryContainer = Color(0xFF00344A),
    secondary = PurpleAccent,
    background = Background,
    surface = Surface,
    surfaceVariant = Surface2,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    outline = BorderColor,
    error = RedError,
    tertiary = GreenSuccess
)

@Composable
fun ECBTrackerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
