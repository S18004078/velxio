from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.arduino_cli import ArduinoCLIService

router = APIRouter()
arduino_cli = ArduinoCLIService()


class CompileRequest(BaseModel):
    code: str
    board_fqbn: str = "arduino:avr:uno"


class CompileResponse(BaseModel):
    success: bool
    hex_content: str | None = None
    binary_content: str | None = None  # base64-encoded .bin for RP2040
    binary_type: str | None = None     # 'bin' or 'uf2'
    stdout: str
    stderr: str
    error: str | None = None
    core_install_log: str | None = None  # Log from auto core installation


@router.post("/", response_model=CompileResponse)
async def compile_sketch(request: CompileRequest):
    """
    Compile Arduino sketch and return hex/binary.
    Auto-installs the required board core if not present.
    """
    try:
        # Auto-install core if needed (e.g. rp2040:rp2040 for Pico)
        core_status = await arduino_cli.ensure_core_for_board(request.board_fqbn)
        core_log = core_status.get("log", "")

        if core_status.get("needed") and not core_status.get("installed"):
            return CompileResponse(
                success=False,
                stdout="",
                stderr=core_log,
                error=f"Failed to install required core: {core_status.get('core_id')}"
            )

        result = await arduino_cli.compile(request.code, request.board_fqbn)
        return CompileResponse(
            success=result["success"],
            hex_content=result.get("hex_content"),
            binary_content=result.get("binary_content"),
            binary_type=result.get("binary_type"),
            stdout=result.get("stdout", ""),
            stderr=result.get("stderr", ""),
            error=result.get("error"),
            core_install_log=core_log if core_log else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/setup-status")
async def setup_status():
    """
    Return the current state of arduino-cli and installed cores.
    Useful for the frontend to show setup diagnostics.
    """
    return await arduino_cli.get_setup_status()


@router.post("/ensure-core")
async def ensure_core(request: CompileRequest):
    """
    Pre-install the core required by a board FQBN without compiling.
    """
    result = await arduino_cli.ensure_core_for_board(request.board_fqbn)
    return result


@router.get("/boards")
async def list_boards():
    """
    List available Arduino boards
    """
    boards = await arduino_cli.list_boards()
    return {"boards": boards}
