set -e
# Starts godot with X11 Display using Xvfb and dummy sound device with pulseaudio.
# Also sets locale if not already set.

# Set locale to 'en' if locale is not already set.
# Godot will fallback to this locale anyway and it
# prevents an error message being printed to console.
if [ "$LANG" == "C.UTF-8" ]; then LANG=en; fi

# Start dummy sound device.
if command -v pulseaudio > /dev/null 2>&1; then
  pulseaudio --check || pulseaudio -D
fi

# Running godot with X11 Display.
if [ -n "${GODOT_FORCE_RENDERING_DRIVER:-}" ]; then
  set -- --rendering-driver "$GODOT_FORCE_RENDERING_DRIVER" "$@"
fi
xvfb-run --auto-servernum GODOT_EXECUTABLE "$@"

# Cleanup (allowed to fail).
if command -v pulseaudio > /dev/null 2>&1 && pulseaudio --check > /dev/null 2>&1; then
  pulseaudio -k || true
fi
