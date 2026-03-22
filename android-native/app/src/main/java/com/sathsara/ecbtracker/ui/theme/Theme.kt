package com.sathsara.ecbtracker.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    background = BackgroundDark,
    surface = SurfaceDark,
    surfaceVariant = SurfaceVariantDark,
    outline = BorderDark,
    primary = CyanPrimary,
    secondary = GreenSuccess,
    tertiary = PurpleAccent,
    error = RedDanger,
    onPrimary = Color(0xFF07090F),
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    onSurfaceVariant = TextSub,
)

private val LightColorScheme = lightColorScheme(
    background = BackgroundLight,
    surface = SurfaceLight,
    surfaceVariant = SurfaceVariantLight,
    outline = BorderLight,
    primary = CyanPrimary,
    secondary = GreenSuccess,
    tertiary = PurpleAccent,
    error = RedDanger,
    onPrimary = Color(0xFF07090F),
    onBackground = TextPrimaryLight,
    onSurface = TextPrimaryLight,
    onSurfaceVariant = TextSubLight,
)

@Composable
fun ECBTrackerTheme(
    isDarkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (isDarkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
