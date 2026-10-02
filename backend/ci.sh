#!/usr/bin/env bash

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOWS_DIR="$SCRIPT_DIR/.github/workflows"

declare -A CI_CONFIGS
CI_CONFIGS=(
    [shared]="shared|shared|false|bun"
    [integration]="api/integration|ci-integration|true|bun"
    [ingest]="api/ingest|ci-ingest|true|bun"
    [dashboard]="api/dashboard|ci-dashboard|true|bun"
    [loadbalancer]="services/loadbalancer|ci-loadbalancer|false|rust"
    [mail]="services/mail|ci-mail|true|bun"
    [ingestor]="services/ingestor|ci-ingestor|true|bun"
    [orchestrator]="services/orchestrator|ci-orchestrator|true|bun"
    [deliver]="runtime/deliver|ci-deliver|true|bun"
    [worker]="runtime/worker|ci-worker|true|bun"
)

detect_theme() {
    if [[ -n "$COLORTERM" ]]; then
        if [[ "$COLORTERM" == *"truecolor"* ]] || [[ "$COLORTERM" == *"256"* ]]; then
            echo "dark"
            return
        fi
    fi
    
    if [[ -n "$KYRAZO_THEME" ]]; then
        echo "$KYRAZO_THEME"
        return
    fi
    
    if [[ -n "$THEME" ]]; then
        echo "$THEME"
        return
    fi
    
    if command -v gsettings &>/dev/null; then
        local scheme
        scheme=$(gsettings get org.gnome.desktop.interface color-scheme 2>/dev/null || echo "")
        if [[ "$scheme" == *"dark"* ]]; then
            echo "dark"
            return
        fi
    fi
    
    if [[ -f "$HOME/.config/kyrazo/theme" ]]; then
        local theme_file
        theme_file=$(cat "$HOME/.config/kyrazo/theme")
        if [[ "$theme_file" == "dark" ]] || [[ "$theme_file" == "light" ]]; then
            echo "$theme_file"
            return
        fi
    fi
    
    echo "dark"
}

setup_colors() {
    local theme="$1"
    
    if [[ "$theme" == "dark" ]]; then
        C_RESET='\033[0m'
        C_SUCCESS='\033[38;5;121m'
        C_ERROR='\033[38;5;203m'
        C_WARNING='\033[38;5;228m'
        C_INFO='\033[38;5;117m'
        C_HEADER='\033[38;5;141m'
        C_CI_NAME='\033[38;5;219m'
        C_DIM='\033[38;5;244m'
        C_BRIGHT='\033[38;5;255m'
    else
        C_RESET='\033[0m'
        C_SUCCESS='\033[32m'
        C_ERROR='\033[31m'
        C_WARNING='\033[33m'
        C_INFO='\033[34m'
        C_HEADER='\033[35m'
        C_CI_NAME='\033[35m'
        C_DIM='\033[90m'
        C_BRIGHT='\033[30m'
    fi
}

print_header() {
    local total_time="$1"
    local bun_version="$2"
    
    echo -e "${C_HEADER}╔══════════════════════════════════════════════════════════════╗${C_RESET}"
    echo -e "${C_HEADER}║  🧪 KYRAZO CI BUILD REPORT                                     ${C_RESET}"
    echo -e "${C_HEADER}║  📅 $(date '+%a %b %d %Y') • ⏱️ Total: ${total_time}s                        ${C_RESET}"
    echo -e "${C_HEADER}╚══════════════════════════════════════════════════════════════╝${C_RESET}"
    echo ""
    echo -e "${C_INFO}ℹ${C_RESET}  SETUP: Detected ${THEME_DISPLAY} theme • Bun ${bun_version}"
    echo ""
    echo -e "${C_DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
    echo ""
}

print_summary() {
    local total="$1"
    local passed="$2"
    local failed="$3"
    local skipped="$4"
    
    echo ""
    echo -e "${C_DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
    echo ""
    
    if [[ "$failed" -eq 0 ]]; then
        echo -e "${C_SUCCESS} SUMMARY: ${passed}/${total} CIs PASSED •  Failed: ${failed} • Skipped: ${skipped}${C_RESET}"
    else
        echo -e "${C_ERROR} SUMMARY: ${passed}/${total} CIs PASSED •  Failed: ${failed} • Skipped: ${skipped}${C_RESET}"
    fi
}

check_dependency() {
    local ci_key="$1"
    local config="${CI_CONFIGS[$ci_key]}"
    local depends_shared
    
    IFS='|' read -r -a parts <<< "$config"
    depends_shared="${parts[2]}"
    
    [[ "$depends_shared" == "true" ]]
}

run_step() {
    local step_name="$1"
    local workdir="$2"
    shift 2
    local command=("$@")
    
    echo -e "${C_DIM}│${C_RESET}  $step_name... "
    local output
    local exit_code
    output=$(cd "$workdir" && "${command[@]}" 2>&1)
    exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        echo -e "${C_DIM}│${C_RESET}  ${C_SUCCESS}✓${C_RESET} PASS"
        return 0
    else
        echo -e "${C_DIM}│${C_RESET}  ${C_ERROR}✗${C_RESET} FAIL (exit code: $exit_code)"
        echo -e "${C_DIM}│${C_RESET}  ${C_ERROR}Error output:${C_RESET}"
        if [[ -n "$output" ]]; then
            echo "$output" | head -15 | while IFS= read -r line; do
                echo -e "${C_DIM}│${C_RESET}  $line"
            done
        else
            echo -e "${C_DIM}│${C_RESET}  (no output)"
        fi
        return 1
    fi
}

run_shared_ci() {
    local start_time
    start_time=$(date +%s)
    
    echo -e "${C_CI_NAME}➤${C_RESET}  ${C_CI_NAME}ci-shared (Shared Library)${C_RESET}"
    
    local install_result=0
    local typecheck_result=0
    local build_result=0
    
    run_step "Installing dependencies" "$SCRIPT_DIR/shared" bun install
    install_result=$?
    
    run_step "Typecheck" "$SCRIPT_DIR/shared" bunx tsc --noEmit
    typecheck_result=$?
    
    run_step "Build" "$SCRIPT_DIR/shared" bun run build
    build_result=$?
    
    local end_time
    end_time=$(date +%s)
    local elapsed=$((end_time - start_time))
    
    if [[ $install_result -eq 0 && $typecheck_result -eq 0 && $build_result -eq 0 ]]; then
        echo ""
        return 0
    else
        echo ""
        return 1
    fi
}

run_loadbalancer_ci() {
    local start_time
    start_time=$(date +%s)
    
    echo -e "${C_CI_NAME}➤${C_RESET}  ${C_CI_NAME}ci-loadbalancer (Loadbalancer Service)${C_RESET}"
    
    local check_result=0
    local build_result=0
    
    run_step "Cargo Check" "$SCRIPT_DIR/services/loadbalancer" cargo check
    check_result=$?
    
    run_step "Cargo Build (release)" "$SCRIPT_DIR/services/loadbalancer" cargo build --release
    build_result=$?
    
    local end_time
    end_time=$(date +%s)
    local elapsed=$((end_time - start_time))
    
    if [[ $check_result -eq 0 && $build_result -eq 0 ]]; then
        echo ""
        return 0
    else
        echo ""
        return 1
    fi
}

run_bun_ci() {
    local ci_key="$1"
    local project_path="$2"
    local start_time
    start_time=$(date +%s)
    
    local display_name="$ci_key"
    [[ "$ci_key" == "integration" ]] && display_name="integration (Integration API)"
    [[ "$ci_key" == "ingest" ]] && display_name="ingest (Ingest API)"
    [[ "$ci_key" == "dashboard" ]] && display_name="dashboard (Dashboard API)"
    [[ "$ci_key" == "mail" ]] && display_name="mail (Mail Runtime)"
    [[ "$ci_key" == "ingestor" ]] && display_name="ingestor (Ingestor Runtime)"
    [[ "$ci_key" == "orchestrator" ]] && display_name="orchestrator (Orchestrator Service)"
    [[ "$ci_key" == "deliver" ]] && display_name="deliver (Deliver Runtime)"
    [[ "$ci_key" == "worker" ]] && display_name="worker (Worker Runtime)"
    
    echo -e "${C_CI_NAME}➤${C_RESET}  ${C_CI_NAME}ci-${ci_key}${C_RESET} (${display_name})"
    
    local shared_install_result=0
    local shared_build_result=0
    local install_result=0
    local typecheck_result=0
    local build_result=0
    
    run_step "Install shared dependencies" "$SCRIPT_DIR/shared" bun install
    shared_install_result=$?
    
    run_step "Build shared lib" "$SCRIPT_DIR/shared" bun run build
    shared_build_result=$?
    
    run_step "Install service dependencies" "$SCRIPT_DIR/$project_path" bun install
    install_result=$?
    
    echo -e "${C_DIM}│${C_RESET}  Typecheck... "
    local output
    if [[ "$ci_key" == "integration" ]] || [[ "$ci_key" == "ingest" ]] || [[ "$ci_key" == "dashboard" ]]; then
        output=$(cd "$SCRIPT_DIR/$project_path" && bun run typecheck 2>&1)
    else
        output=$(cd "$SCRIPT_DIR/$project_path" && bunx tsc --noEmit 2>&1)
    fi
    local exit_code=$?
    if [[ $exit_code -eq 0 ]]; then
        echo -e "${C_DIM}│${C_RESET}  ${C_SUCCESS}✓${C_RESET} PASS"
        typecheck_result=0
    else
        echo -e "${C_DIM}│${C_RESET}  ${C_ERROR}✗${C_RESET} FAIL (exit code: $exit_code)"
        echo -e "${C_DIM}│${C_RESET}  ${C_ERROR}Error output:${C_RESET}"
        if [[ -n "$output" ]]; then
            echo "$output" | head -15 | while IFS= read -r line; do
                echo -e "${C_DIM}│${C_RESET}  $line"
            done
        else
            echo -e "${C_DIM}│${C_RESET}  (no output)"
        fi
        typecheck_result=1
    fi
    
    run_step "Build" "$SCRIPT_DIR/$project_path" bun run build
    build_result=$?
    
    local end_time
    end_time=$(date +%s)
    local elapsed=$((end_time - start_time))
    
    if [[ $shared_install_result -eq 0 && $shared_build_result -eq 0 && $install_result -eq 0 && $typecheck_result -eq 0 && $build_result -eq 0 ]]; then
        echo ""
        return 0
    else
        echo ""
        return 1
    fi
}

run_single_ci() {
    local ci_key="$1"
    
    local config="${CI_CONFIGS[$ci_key]}"
    if [[ -z "$config" ]]; then
        echo -e "${C_ERROR}Error: Unknown CI '${ci_key}'${C_RESET}"
        return 2
    fi
    
    if [[ "$ci_key" == "shared" ]]; then
        run_shared_ci
        return $?
    fi
    
    IFS='|' read -r -a parts <<< "$config"
    local project_path="${parts[0]}"
    local runtime="${parts[3]}"
    
    case "$runtime" in
        bun)
            run_bun_ci "$ci_key" "$project_path"
            ;;
        rust)
            if [[ "$ci_key" == "loadbalancer" ]]; then
                run_loadbalancer_ci
            else
                echo -e "${C_ERROR}Error: Unknown runtime '${runtime}'${C_RESET}"
                return 2
            fi
            ;;
    esac
}

run_all_cis() {
    local total=0
    local passed=0
    local failed=0
    local skipped=0
    
    local -a ci_order
    ci_order=(shared loadbalancer integration ingest dashboard mail ingestor orchestrator deliver worker)
    
    for ci_key in "${ci_order[@]}"; do
        if [[ "$ci_key" == "shared" ]]; then
            ((total++))
            if run_shared_ci; then
                ((passed++))
            else
                ((failed++))
            fi
        elif [[ "$ci_key" == "loadbalancer" ]]; then
            ((total++))
            if run_loadbalancer_ci; then
                ((passed++))
            else
                ((failed++))
            fi
        else
            local config="${CI_CONFIGS[$ci_key]}"
            IFS='|' read -r -a parts <<< "$config"
            local project_path="${parts[0]}"
            
            ((total++))
            if run_bun_ci "$ci_key" "$project_path"; then
                ((passed++))
            else
                ((failed++))
            fi
        fi
    done
    
    print_summary "$total" "$passed" "$failed" "$skipped"
    
    if [[ $failed -eq 0 ]]; then
        return 0
    else
        return 1
    fi
}

show_menu() {
    echo -e "${C_HEADER}Available CIs:${C_RESET}"
    echo ""
    
    local -a options
    options=("All" "shared" "integration" "ingest" "dashboard" "loadbalancer" "mail" "ingestor" "orchestrator" "deliver" "worker" "Quit")
    
    echo -en "${C_INFO}Select an option: ${C_RESET} "
    PS3=""
    
    select opt in "${options[@]}"; do
        case "$opt" in
            "All")
                exec "$0" --all
                ;;
            "Quit")
                echo "Exiting..."
                exit 0
                ;;
            "")
                echo -e "${C_ERROR}Invalid option${C_RESET}"
                ;;
            *)
                exec "$0" "$opt"
                ;;
        esac
        break
    done
}

show_help() {
    echo "Usage: $0 [OPTIONS] [CI_NAMES...]"
    echo ""
    echo "Options:"
    echo "  --all          Run all CIs (shared first)"
    echo "  --list         List available CIs"
    echo "  --help, -h     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Interactive menu"
    echo "  $0 --all             # Run all CIs"
    echo "  $0 shared            # Run only shared CI"
    echo "  $0 integration       # Run integration CI"
    echo "  $0 integration ingest # Run multiple CIs"
    echo ""
    echo "Available CIs:"
    echo "  shared, integration, ingest, dashboard, loadbalancer,"
    echo "  mail, ingestor, orchestrator, deliver, worker"
}

show_list() {
    echo -e "${C_HEADER}Available CIs:${C_RESET}"
    echo ""
    
    for ci_key in shared loadbalancer integration ingest dashboard mail ingestor orchestrator deliver worker; do
        local config="${CI_CONFIGS[$ci_key]}"
        IFS='|' read -r -a parts <<< "$config"
        local project_path="${parts[0]}"
        local depends_shared="${parts[2]}"
        
        local shared_dep=""
        if [[ "$depends_shared" == "true" ]]; then
            shared_dep="${C_DIM}(depends on shared)${C_RESET}"
        else
            shared_dep="${C_DIM}(standalone)${C_RESET}"
        fi
        
        printf "  ${C_CI_NAME}%-15s${C_RESET} %-35s %s\n" "$ci_key" "$project_path" "$shared_dep"
    done
}

main() {
    local theme
    theme=$(detect_theme)
    THEME_DISPLAY="$theme"
    setup_colors "$theme"
    
    if [[ ! -x "$(command -v bun)" ]]; then
        echo -e "${C_WARNING}Warning: bun is not installed${C_RESET}"
        BUN_VERSION="not found"
    else
        BUN_VERSION=$(bun --version 2>/dev/null || echo "unknown")
    fi
    
    if [[ $# -eq 0 ]]; then
        show_menu
        return 0
    fi
    
    local start_time
    start_time=$(date +%s)
    
    local run_mode=""
    local ci_args=()
    
    case "$1" in
        --help|-h)
            show_help
            exit 0
            ;;
        --list)
            show_list
            exit 0
            ;;
        --all)
            run_mode="all"
            ;;
        *)
            run_mode="specific"
            ci_args=("$@")
            ;;
    esac
    
    print_header "0" "$BUN_VERSION"
    
    local result=0
    
    if [[ "$run_mode" == "all" ]]; then
        run_all_cis
        result=$?
    elif [[ "$run_mode" == "specific" ]]; then
        local total=0
        local passed=0
        local failed=0
        local skipped=0
        local shared_ran=0
        
        for ci_key in "${ci_args[@]}"; do
            if [[ -z "${CI_CONFIGS[$ci_key]}" ]]; then
                echo -e "${C_ERROR}Error: Unknown CI '${ci_key}'${C_RESET}"
                show_help
                exit 2
            fi
            
            local needs_shared
            if check_dependency "$ci_key"; then
                needs_shared=1
            else
                needs_shared=0
            fi
            
            if [[ $needs_shared -eq 1 && $shared_ran -eq 0 ]]; then
                ((total++))
                if run_shared_ci; then
                    ((passed++))
                else
                    ((failed++))
                fi
                shared_ran=1
            fi
            
            ((total++))
            if run_single_ci "$ci_key"; then
                ((passed++))
            else
                ((failed++))
            fi
        done
        
        print_summary "$total" "$passed" "$failed" "$skipped"
        
        if [[ $failed -eq 0 ]]; then
            result=0
        else
            result=1
        fi
    fi
    
    local end_time
    end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    echo ""
    echo -e "${C_DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
    echo ""
    echo -e "${C_INFO}⏱️  Total execution time: ${total_time}s${C_RESET}"
    
    exit $result
}

main "$@"
