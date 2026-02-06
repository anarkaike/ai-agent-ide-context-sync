#!/bin/bash

# AI Agent Tone Integration for ZSH
# Usage: source path/to/this/script.sh
# Then add ${AI_AGENT_PROMPT} to your PROMPT/PS1 variable.

AI_DOC_PATH="${AI_DOC_PATH:-$(pwd)/packages/cli/cli/ai-doc.js}"

get_tone_color() {
    local color_name=$1
    case "$color_name" in
        "cyan") echo "%F{cyan}" ;;
        "green") echo "%F{green}" ;;
        "magenta") echo "%F{magenta}" ;;
        "red") echo "%F{red}" ;;
        "yellow") echo "%F{yellow}" ;;
        *) echo "%F{white}" ;;
    esac
}

update_ai_tone() {
    # Check if tone file exists
    local TONE_FILE="$HOME/.ai-workspace/live-state/ui-tone.json"
    
    if [ -f "$TONE_FILE" ]; then
        # Read JSON (using node for reliability if available, else grep)
        # Using grep/sed for speed in shell
        local TONE_RAW=$(cat "$TONE_FILE")
        local TONE_COLOR=$(echo "$TONE_RAW" | grep -o '"color":"[^"]*"' | cut -d'"' -f4)
        local TONE_EMOJI=$(echo "$TONE_RAW" | grep -o '"emoji":"[^"]*"' | cut -d'"' -f4)
        
        local ANSI_COLOR=$(get_tone_color "$TONE_COLOR")
        
        # Export for PS1
        export AI_AGENT_PROMPT="${ANSI_COLOR}${TONE_EMOJI}%f "
    else
        export AI_AGENT_PROMPT=""
    fi
}

# Hook into precmd (ZSH) or PROMPT_COMMAND (Bash)
if [ -n "$ZSH_VERSION" ]; then
    precmd_functions+=(update_ai_tone)
elif [ -n "$BASH_VERSION" ]; then
    PROMPT_COMMAND="update_ai_tone; $PROMPT_COMMAND"
fi

echo "🔮 AI Tone Integration Loaded."
echo "👉 Add \${AI_AGENT_PROMPT} to your PS1/PROMPT variable to see it."
