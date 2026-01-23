"""HTML generation and rendering orchestration for viz module."""

import json
import tempfile
import webbrowser
from pathlib import Path
from typing import Any


def calculate_optimal_height(
    data: dict[str, Any],
    options: dict[str, Any],
    min_height: int = 400,
    max_height: int = 1200,
) -> int:
    """Calculate optimal visualization height based on graph data.

    Considers the number of temporal layers and vertical spacing settings
    to determine an appropriate height for displaying the ARG.

    Args:
        data: Graph data dict with nodes and metadata
        options: Visualization options including layout settings
        min_height: Minimum height in pixels
        max_height: Maximum height in pixels

    Returns:
        Calculated optimal height in pixels
    """
    # Get node times to count temporal layers
    nodes = data.get("nodes", [])
    if not nodes:
        return min_height

    # Extract unique time values (temporal layers)
    times = set()
    for node in nodes:
        time = node.get("time")
        if time is not None:
            # Round to avoid floating point precision creating fake layers
            times.add(round(time, 6))

    num_layers = len(times)
    if num_layers <= 1:
        return min_height

    # Get vertical spacing setting (percentage, default 100)
    initial_state = options.get("initialState", {})
    layout = initial_state.get("layout", {})
    vertical_spacing = layout.get("verticalSpacing", 100.0)

    # Base height per layer, adjusted by vertical spacing
    # At 100% spacing, use ~35px per layer
    # At 50% spacing, use ~17.5px per layer
    base_per_layer = 35 * (vertical_spacing / 100.0)

    # Calculate height: base + layers contribution
    # Add some padding for UI elements
    calculated_height = int(120 + (num_layers * base_per_layer))

    # Clamp to reasonable bounds
    return max(min_height, min(calculated_height, max_height))


class Renderer:
    """Generates HTML for ARGscape visualizations."""

    def __init__(self, mode: str, data: dict[str, Any], options: dict[str, Any]):
        self.mode = mode
        self.data = data
        self.options = options

    def _get_standalone_dir(self) -> Path:
        """Get path to standalone React app build."""
        return Path(__file__).parent / "standalone"

    def _generate_html(self) -> str:
        """Generate HTML with embedded data and options."""
        standalone_dir = self._get_standalone_dir()

        # Check if built React app exists
        js_path = standalone_dir / "standalone.js"

        if js_path.exists():
            js_content = js_path.read_text()
        else:
            # Placeholder until React app is built
            js_content = '''
console.log("ARGscape viz standalone app not built yet.");
console.log("Data:", window.ARGSCAPE_DATA);
console.log("Options:", window.ARGSCAPE_OPTIONS);
document.getElementById("argscape-root").innerHTML =
    "<div style='padding:40px;font-family:system-ui;'>" +
    "<h2>ARGscape Visualization</h2>" +
    "<p>React app not built yet. Run: <code>cd argscape/viz/src && npm run build</code></p>" +
    "<p>Mode: " + window.ARGSCAPE_OPTIONS.mode + "</p>" +
    "<p>Nodes: " + window.ARGSCAPE_DATA.nodes.length + "</p>" +
    "<p>Edges: " + window.ARGSCAPE_DATA.edges.length + "</p>" +
    "</div>";
var ready = document.createElement("div");
ready.id = "argscape-ready";
ready.style.display = "none";
document.body.appendChild(ready);
'''

        # CSS is injected by the IIFE bundle via JavaScript
        html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ARGscape Visualization</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        html, body, #argscape-root {{ width: 100%; height: 100%; overflow: hidden; }}
    </style>
</head>
<body>
    <div id="argscape-root"></div>
    <script>
        window.ARGSCAPE_DATA = {json.dumps(self.data)};
        window.ARGSCAPE_OPTIONS = {json.dumps(self.options)};
    </script>
    <script>
        {js_content}
    </script>
</body>
</html>'''
        return html

    def open_browser(self, interactive: bool = True) -> str:
        """Open visualization in default browser."""
        # Default to expanded filters in browser mode (if not already set)
        if "filtersExpanded" not in self.options:
            self.options = {**self.options, "filtersExpanded": True}
        html = self._generate_html()

        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.html',
            prefix='argscape_viz_',
            delete=False,
            encoding='utf-8'
        ) as f:
            f.write(html)
            temp_path = f.name

        webbrowser.open(f'file://{temp_path}')
        return temp_path

    def display_notebook(self) -> None:
        """Render in Jupyter notebook with minimal UI."""
        try:
            from IPython.display import HTML, display
            import base64
        except ImportError:
            raise ImportError("IPython required for notebook display")

        # For notebook, use minimal mode by default (no QuickActionsBar/Legend)
        # unless user explicitly requested controls via show_controls=True
        show_controls = self.options.get("showControls", False)
        options_with_minimal = {
            **self.options,
            "minimal": not show_controls,
            "filtersExpanded": False,
        }
        original_options = self.options
        self.options = options_with_minimal
        html = self._generate_html()
        self.options = original_options

        # Use base64 encoding to avoid HTML escaping issues
        html_b64 = base64.b64encode(html.encode('utf-8')).decode('ascii')

        # Calculate responsive height based on graph data
        user_height = self.options.get('height', 800)
        user_width = self.options.get('width', 1200)
        optimal_height = calculate_optimal_height(self.data, self.options)

        # Check if user explicitly set custom dimensions (different from defaults)
        height_specified = user_height != 800
        width_specified = user_width != 1200
        user_specified = height_specified or width_specified

        # If user specified dimensions, use exactly those; otherwise auto-size
        if height_specified:
            desired_height = user_height
        else:
            desired_height = max(user_height, optimal_height)
        desired_width = user_width

        # Create responsive iframe that fits notebook width
        # JavaScript scales both dimensions proportionally to fit viewport
        iframe_html = f'''
<iframe id="argscape-frame-{id(self)}"
        style="width: {desired_width}px; max-width: 100%; height: {desired_height}px; border: 1px solid #ccc; border-radius: 8px;">
</iframe>
<script>
(function() {{
    var frame = document.getElementById("argscape-frame-{id(self)}");
    var html = atob("{html_b64}");

    // Scale to fit viewport unless user explicitly specified dimensions
    var userSpecified = {str(user_specified).lower()};
    var desiredHeight = {desired_height};
    var desiredWidth = {desired_width};

    if (!userSpecified) {{
        // Calculate max dimensions (85% of viewport, minimum 400px height)
        var maxHeight = Math.max(Math.floor(window.innerHeight * 0.85), 400);
        var maxWidth = Math.floor(window.innerWidth * 0.95);

        // Calculate scale factors for both dimensions
        var scaleH = desiredHeight > maxHeight ? maxHeight / desiredHeight : 1;
        var scaleW = desiredWidth > maxWidth ? maxWidth / desiredWidth : 1;

        // Use the smaller scale to ensure both dimensions fit
        var scale = Math.min(scaleH, scaleW);

        if (scale < 1) {{
            var newHeight = Math.floor(desiredHeight * scale);
            var newWidth = Math.floor(desiredWidth * scale);

            // Update iframe size
            frame.style.height = newHeight + "px";
            frame.style.width = newWidth + "px";

            // Update the embedded options so React app renders at correct size
            html = html.replace(/"height":\\s*\\d+/, '"height": ' + newHeight);
            html = html.replace(/"width":\\s*\\d+/, '"width": ' + newWidth);
        }}
    }}

    frame.srcdoc = html;
}})();
</script>
'''
        display(HTML(iframe_html))

    def export_static(self, path: str, format: str = "png", dpi: int = 150) -> None:
        """Export via Playwright."""
        from .export import capture
        html = self._generate_html()
        capture(html, path, format, dpi=dpi)


def in_notebook() -> bool:
    """Detect Jupyter environment."""
    try:
        shell = get_ipython().__class__.__name__  # type: ignore
        return shell in ('ZMQInteractiveShell', 'Shell', 'Interpreter')
    except NameError:
        return False
