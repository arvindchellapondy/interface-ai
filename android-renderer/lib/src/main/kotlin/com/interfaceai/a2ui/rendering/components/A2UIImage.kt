package com.interfaceai.a2ui.rendering.components

import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.interfaceai.a2ui.models.A2UIComponent
import com.interfaceai.a2ui.processing.DataBindingResolver
import com.interfaceai.a2ui.processing.TokenResolver
import com.interfaceai.a2ui.rendering.applyA2UIStyle

@Composable
fun A2UIImageView(
    component: A2UIComponent,
    tokenResolver: TokenResolver,
    dataResolver: DataBindingResolver,
    modifier: Modifier = Modifier
) {
    val style = component.style
    val width = tokenResolver.resolveStyleFloat(style, "width")
    val height = tokenResolver.resolveStyleFloat(style, "height")

    // URL could be in a "url" property or data-bound
    val url = component.text?.let { dataResolver.resolve(it) } ?: ""

    AsyncImage(
        model = url,
        contentDescription = null,
        contentScale = ContentScale.Fit,
        modifier = modifier
            .let { m ->
                if (width != null && height != null) m.size(width.dp, height.dp)
                else m
            }
            .applyA2UIStyle(style, tokenResolver)
    )
}
