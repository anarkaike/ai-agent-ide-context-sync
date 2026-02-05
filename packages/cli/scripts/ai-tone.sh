#!/bin/bash

# AI Agent Tone Integration for Zsh/Bash
# Add this to your .zshrc or .bashrc:
# source /path/to/ai-agent-tone.sh

get_ai_tone_color() {
  # Default color (Cyan)
  local color="\033[0;36m"
  
  # Try to get tone from ai-doc CLI
  if command -v ai-doc &> /dev/null; then
    # We use a timeout to prevent lag if the command is slow
    local tone_json=$(ai-doc tone 2>/dev/null)
    
    if [ -n "$tone_json" ]; then
      # Simple parsing since we don't want to depend on jq
      local tone=$(echo "$tone_json" | grep -o '"tone":"[^"]*"' | cut -d'"' -f4)
      
      case "$tone" in
        "neutral")
          color="\033[0;36m" # Cyan
          ;;
        "focused")
          color="\033[0;32m" # Green
          ;;
        "creative")
          color="\033[0;35m" # Magenta
          ;;
        "urgent")
          color="\033[0;31m" # Red
          ;;
        "cautious")
          color="\033[0;33m" # Yellow
          ;;
      esac
    fi
  fi
  
  echo "$color"
}

# Function to update prompt
update_ai_prompt() {
  local tone_color=$(get_ai_tone_color)
  local reset="\033[0m"
  
  # Export for use in PS1
  export AI_TONE_COLOR="$tone_color"
  export AI_TONE_RESET="$reset"
}

# Hook into shell prompt command
if [ -n "$ZSH_VERSION" ]; then
  precmd_functions+=(update_ai_prompt)
elif [ -n "$BASH_VERSION" ]; then
  PROMPT_COMMAND="update_ai_prompt; $PROMPT_COMMAND"
fi
