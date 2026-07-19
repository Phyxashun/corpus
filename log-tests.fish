#!/usr/bin/fish

# ==========================================
# 1. PRESENTATION LAYER (UI Functions)
# ==========================================

function get_padding
    set -l width $argv[1]
    set -l max_width $argv[2]

    # Calculate padding splits
    set -l total_pad (math $max_width - $width)
    set -l left_pad_width (math -s0 "$total_pad / 2")
    set -l right_pad_width (math "$total_pad - $left_pad_width")

    # Generate the space strings safely
    set -l left_spaces ""
    set -l right_spaces ""
    if test $left_pad_width -gt 0
        set left_spaces (string repeat -n $left_pad_width " ")
    end
    if test $right_pad_width -gt 0
        set right_spaces (string repeat -n $right_pad_width " ")
    end

    echo "$left_spaces"
    echo "$right_spaces"
end

function draw_box
    # Safely extract parameter elements
    set -l rawText (string trim "$argv[1]")

    # Fallback default value assignment
    set -l max_width 60
    if test (count $argv) -ge 2; and test -n "$argv[2]"
        set max_width $argv[2]
    end

    # Frame text padding structure
    set -l text " $rawText "
    set -l width (string length "$text")

    # Guard clause against column boundary overflow
    if test $width -gt $max_width
        set text (string sub -l $max_width "$text")
        set width $max_width
    end

    # Call get_padding and deserialize its structural tokens using split
    set -l padding_tokens (string split ":" (get_padding $width $max_width))
    set -l left_spaces $padding_tokens[1]
    set -l right_spaces $padding_tokens[2]

    # Render out borders matching the max_width container size
    set -l top_bottom (string repeat -n $max_width "─")
    set -l magenta (set_color magenta)
    set -l normal (set_color normal)

    echo "╭$top_bottom╮"
    echo "│$left_spaces$magenta$text$normal$right_spaces│"
    echo "╰$top_bottom╯"
end

function show_header
    set -l log_file $argv[1]
    echo
    set_color cyan
    echo "Running tests and logging output to:"
    set_color normal
    draw_box "$log_file" 60
    echo
end

function show_success
    set_color green
    echo "Tests completed successfully. All tests passed."
    set_color normal
end

function show_failure
    set -l log_file_path $argv[1]
    set_color red
    echo "An error occurred. See log for details: $log_file_path"
    set_color normal
end


# ==========================================
# 2. BUSINESS LOGIC LAYER (Log Management)
# ==========================================

function rotate_logs
    set -l log_dir $argv[1]
    mkdir -p $log_dir

    set -l existing_logs (find $log_dir -maxdepth 1 -name '*_tests.results.log' | sort)

    if test (count $existing_logs) -ge 10
        rm -f $existing_logs[1]
        set_color cyan
        echo "Oldest log file has been removed."
        set_color normal
    end
end


# ==========================================
# 3. CORE EXECUTION LAYER (Test Orchestration)
# ==========================================

function run_test_suite
    set -l tests_path $argv[1]
    set -l log_file_path $argv[2]

    bun test --coverage $tests_path > $log_file_path 2>&1
    return $status
end


# ==========================================
# 4. CONFIGURATION & RUNTIME ENGINE
# ==========================================

set -l script_dir (dirname (status -f))
set -l timestamp (date +%Y-%m-%d_%H%M%S)
set -l log_dir "$script_dir/logs"
set -l log_file "$timestamp"_tests.results.log
set -l log_file_path "$log_dir/$log_file"
set -l tests_path "$script_dir/tests"

# Pipeline execution lifecycle
rotate_logs $log_dir
show_header $log_file
run_test_suite $tests_path $log_file_path
set -l exit_code $status

if test $exit_code -eq 0
    show_success
    exit 0
else
    show_failure $log_file_path
    exit $exit_code
end
