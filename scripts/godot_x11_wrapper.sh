set -e
# Starts godot with X11 Display using Xvfb and dummy sound device with pulseaudio.
# Also sets locale if not already set.

# Set locale to 'en' if locale is not already set.
# Godot will fallback to this locale anyway and it
# prevents an error message being printed to console.
if [ "$LANG" == "C.UTF-8" ]; then LANG=en; fi

# Start dummy sound device.
pulseaudio --check || pulseaudio -D

# Running godot with X11 Display.
xvfb-run --auto-servernum GODOT_EXECUTABLE "$@"

# Cleanup (allowed to fail).
pulseaudio -k || true
