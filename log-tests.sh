#!/usr/bin/env bash

# ==========================================
# 1. PRESENTATION LAYER (UI Functions)
# ==========================================

get_padding() {
    local width=$1
    local max_width=$2

    # Calculate padding splits using Bash arithmetic
    local total_pad=$((max_width - width))
    local left_pad_width=$((total_pad / 2))
    local right_pad_width=$((total_pad - left_pad_width))

    # Generate the space strings safely using printf
    local left_spaces=""
    local right_spaces=""
    [[ $left_pad_width -gt 0 ]] && printf -v left_spaces '%*s' "$left_pad_width" ""
    [[ $right_pad_width -gt 0 ]] && printf -v right_spaces '%*s' "$right_pad_width" ""

    # Return both strings cleanly separated by a delimiter that won't appear in spaces
    echo "${left_spaces}:${right_spaces}"
}

draw_box() {
    # Trim leading/trailing spaces natively in Bash
    local rawText
    rawText=$(echo "$1" | xargs)

    # Fallback default value assignment
    local max_width=60
    if [[ $# -ge 2 && -n "$2" ]]; then
        max_width=$2
    fi

    # Frame text padding structure
    local text=" ${rawText} "
    local width=${#text}

    # Guard clause against column boundary overflow
    if [[ $width -gt $max_width ]]; then
        text="${text:0:max_width}"
        width=$max_width
    fi

    # Call get_padding and deserialize its structural tokens using IFS splitting
    IFS=":" read -r left_spaces right_spaces < <(get_padding "$width" "$max_width")

    # Render out borders matching the max_width container size using printf repeat
    local top_bottom
    printf -v top_bottom '─%.0s' $(seq 1 "$max_width")

    # ANSI Escape Codes for color
    local magenta="\033[35m"
    local normal="\033[0m"

    echo "╭${top_bottom}╮"
    echo -e "│${left_spaces}${magenta}${text}${normal}${right_spaces}│"
    echo "╰${top_bottom}╯"
}

show_header() {
    local log_file=$1
    echo
    echo -e "\033[36mRunning tests and logging output to:\033[0m"
    draw_box "$log_file" 60
    echo
}

show_success() {
    echo -e "\033[32mTests completed successfully. All tests passed.\033[0m"
}

show_failure() {
    local log_file_path=$1
    echo -e "\033[31mAn error occurred. See log for details: $log_file_path\033[0m"
}

# ==========================================
# 2. BUSINESS LOGIC LAYER (Log Management)
# ==========================================

rotate_logs() {
    local log_dir=$1
    mkdir -p "$log_dir"

    # Read existing logs securely into a Bash array
    local existing_logs=()
    while IFS= read -r line; do
        existing_logs+=("$line")
    done < <(find "$log_dir" -maxdepth 1 -name '*_tests.results.log' | sort)

    if [[ ${#existing_logs[@]} -ge 10 ]]; then
        rm -f "${existing_logs[0]}"
        echo -e "\033[36mOldest log file has been removed.\033[0m"
    fi
}

# ==========================================
# 3. CORE EXECUTION LAYER (Test Orchestration)
# ==========================================

run_test_suite() {
    local tests_path=$1
    local log_file_path=$2
    bun test --coverage "$tests_path" > "$log_file_path" 2>&1
    return $?
}

# ==========================================
# 4. CONFIGURATION & RUNTIME ENGINE
# ==========================================

# Bash equivalent of status -f / dirname
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
timestamp=$(date +%Y-%m-%d_%H%M%S)
log_dir="$SCRIPT_DIR/logs"
log_file="${timestamp}_tests.results.log"
log_file_path="$log_dir/$log_file"
tests_path="$SCRIPT_DIR/tests"

# Pipeline execution lifecycle
rotate_logs "$log_dir"
show_header "$log_file"
run_test_suite "$tests_path" "$log_file_path"
exit_code=$?

if [[ $exit_code -eq 0 ]]; then
    show_success
    exit 0
else
    show_failure "$log_file_path"
    exit $exit_code
fi
