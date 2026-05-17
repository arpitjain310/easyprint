import os
import sys
import shutil
import subprocess
import logging

logger = logging.getLogger(__name__)


class PrintError(Exception):
    pass


def _print_with_lp(file_path: str, pages: str, copies: int) -> None:
    """Print via CUPS `lp` (Linux / macOS / Docker)."""
    cmd = ["lp", "-n", str(copies)]
    if pages and pages.lower() != "all":
        cmd.extend(["-o", f"page-ranges={pages}"])
    cmd.append(file_path)

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise PrintError(f"lp failed: {result.stderr.strip() or result.stdout.strip()}")
    logger.info("lp submitted: %s", result.stdout.strip())


def _print_on_windows(file_path: str, pages: str, copies: int) -> None:
    """Print via Windows shell ShellExecute 'print' verb.

    Page-range selection is not supported by the shell verb; whole document
    is sent, repeated `copies` times. For finer control, swap in win32print.
    """
    try:
        import win32api  # type: ignore
    except ImportError:
        raise PrintError(
            "Windows printing requires pywin32. Install with `pip install pywin32`."
        )

    for _ in range(max(1, int(copies))):
        win32api.ShellExecute(0, "print", file_path, None, ".", 0)


def print_file(file_path: str, pages: str = "all", copies: int = 1) -> None:
    if not os.path.exists(file_path):
        raise PrintError(f"File not found: {file_path}")

    copies = max(1, int(copies))

    if shutil.which("lp"):
        _print_with_lp(file_path, pages, copies)
        return

    if sys.platform.startswith("win"):
        _print_on_windows(file_path, pages, copies)
        return

    logger.warning(
        "No printer backend found. Falling back to console log. "
        "Install CUPS (`lp`) on Linux/macOS or pywin32 on Windows."
    )
    print(f"[PRINT-STUB] file={file_path} pages={pages} copies={copies}")
